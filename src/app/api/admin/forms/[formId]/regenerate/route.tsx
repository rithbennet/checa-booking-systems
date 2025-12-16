/**
 * Service Form Regeneration API
 * POST /api/admin/forms/[formId]/regenerate
 *
 * Allows admin to regenerate service forms for a booking.
 */

import { renderToBuffer } from "@react-pdf/renderer";
import { NextResponse } from "next/server";
import { UTFile } from "uploadthing/server";
import { notifyServiceFormReady } from "@/entities/notification/server/form.notifications";
import { requireAdmin } from "@/shared/lib/api-factory";
import { TORTemplate, WorkAreaTemplate } from "@/shared/lib/pdf";
import { db } from "@/shared/server/db";
import { utapi } from "@/shared/server/uploadthing";

interface RouteParams {
	params: Promise<{
		formId: string;
	}>;
}

export async function POST(
	_request: Request,
	{ params }: RouteParams,
): Promise<Response> {
	try {
		const adminUser = await requireAdmin();
		const { formId } = await params;

		if (!formId) {
			return NextResponse.json(
				{ error: "Form ID is required" },
				{ status: 400 },
			);
		}

		// Get the existing form with booking data
		const existingForm = await db.serviceForm.findUnique({
			where: { id: formId },
			include: {
				bookingRequest: {
					include: {
						user: {
							include: {
								faculty: true,
								department: true,
								company: true,
								companyBranch: true,
							},
						},
						serviceItems: {
							include: {
								service: true,
							},
						},
						workspaceBookings: {
							include: {
								equipmentUsages: {
									include: {
										equipment: true,
									},
								},
							},
						},
					},
				},
			},
		});

		if (!existingForm) {
			return NextResponse.json(
				{ error: "Service form not found" },
				{ status: 404 },
			);
		}

		const booking = existingForm.bookingRequest;

		// Generate new form number (increment version)
		const baseNumber = existingForm.formNumber.replace(/-v\d+$/, "");
		const existingVersions = await db.serviceForm.count({
			where: {
				formNumber: {
					startsWith: baseNumber,
				},
			},
		});
		const newFormNumber = `${baseNumber}-v${existingVersions + 1}`;

		// Calculate totals
		const subtotal = booking.serviceItems.reduce(
			(sum, item) => sum + Number(item.totalPrice),
			0,
		);
		const totalAmount = Number(booking.totalAmount);
		const hasWorkspace = booking.workspaceBookings.length > 0;

		// Prepare common data
		const userName = `${booking.user.firstName} ${booking.user.lastName}`;
		const userFaculty =
			booking.user.faculty?.name ??
			booking.user.company?.name ??
			booking.user.companyBranch?.name ??
			"N/A";
		const supervisorName = booking.user.supervisorName ?? "N/A";

		// Generate Service Form (TOR) PDF
		const serviceItem = booking.serviceItems[0];
		const torRefNo = `TOR-${newFormNumber}`;

		const torPdfBuffer = await renderToBuffer(
			<TORTemplate
				date={new Date()}
				equipmentCode={serviceItem?.service.code}
				equipmentName={serviceItem?.service.name}
				refNo={torRefNo}
				supervisorName={supervisorName}
				userEmail={booking.user.email}
				userFaculty={userFaculty}
				userName={userName}
			/>,
		);

		// Upload TOR PDF
		const torFileName = `service-form-${torRefNo}.pdf`;
		const torFile = new UTFile([new Uint8Array(torPdfBuffer)], torFileName, {
			customId: `tor-${booking.id}-${Date.now()}`,
		});

		const torUploadResult = await utapi.uploadFiles([torFile]);
		if (torUploadResult[0]?.error || !torUploadResult[0]?.data) {
			console.error(
				"[FormRegeneration] TOR upload failed:",
				torUploadResult[0]?.error,
			);
			return NextResponse.json(
				{ error: "Failed to upload regenerated service form PDF" },
				{ status: 500 },
			);
		}
		const torUrl = torUploadResult[0].data.url;
		const torKey = torUploadResult[0].data.key;

		// Generate Working Area Agreement PDF (if applicable)
		let waUrl: string | null = null;
		let waKey: string | null = null;

		if (hasWorkspace) {
			const workspaceBooking = booking.workspaceBookings[0];
			if (workspaceBooking) {
				const startDate = new Date(workspaceBooking.startDate);
				const endDate = new Date(workspaceBooking.endDate);
				const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
				const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
				const duration =
					diffDays > 30
						? `${Math.ceil(diffDays / 30)} month(s)`
						: `${diffDays} day(s)`;

				const waRefNo = `WA-${newFormNumber}`;

				const waPdfBuffer = await renderToBuffer(
					<WorkAreaTemplate
						department={booking.user.department?.name}
						duration={duration}
						endDate={endDate}
						faculty={userFaculty}
						purpose={
							booking.projectDescription ??
							workspaceBooking.purpose ??
							undefined
						}
						refNo={waRefNo}
						startDate={startDate}
						studentName={userName}
						supervisorName={supervisorName}
					/>,
				);

				const waFileName = `working-area-${waRefNo}.pdf`;
				const waFile = new UTFile([new Uint8Array(waPdfBuffer)], waFileName, {
					customId: `wa-${booking.id}-${Date.now()}`,
				});

				const waUploadResult = await utapi.uploadFiles([waFile]);
				if (!waUploadResult[0]?.error && waUploadResult[0]?.data) {
					waUrl = waUploadResult[0].data.url;
					waKey = waUploadResult[0].data.key;
				}
			}
		}

		// Update the existing form with new paths
		const updatedForm = await db.$transaction(async (tx) => {
			const form = await tx.serviceForm.update({
				where: { id: formId },
				data: {
					formNumber: newFormNumber,
					subtotal,
					totalAmount,
					validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
					status: "generated",
					serviceFormUnsignedPdfPath: torUrl,
					serviceFormSignedPdfPath: null,
					workingAreaAgreementUnsignedPdfPath: waUrl,
					workingAreaAgreementSignedPdfPath: null,
					generatedBy: adminUser.adminId,
					generatedAt: new Date(),
					downloadedAt: null,
					signedFormsUploadedAt: null,
					signedFormsUploadedBy: null,
				},
			});

			// Create FileBlob and BookingDocument for new TOR
			const torBlob = await tx.fileBlob.create({
				data: {
					key: torKey,
					url: torUrl,
					mimeType: "application/pdf",
					fileName: torFileName,
					sizeBytes: torPdfBuffer.byteLength,
					uploadedById: adminUser.adminId,
				},
			});

			await tx.bookingDocument.create({
				data: {
					bookingId: booking.id,
					type: "service_form_unsigned",
					blobId: torBlob.id,
					createdById: adminUser.adminId,
				},
			});

			if (waUrl && waKey) {
				const waBlob = await tx.fileBlob.create({
					data: {
						key: waKey,
						url: waUrl,
						mimeType: "application/pdf",
						fileName: `working-area-WA-${newFormNumber}.pdf`,
						sizeBytes: 0,
						uploadedById: adminUser.adminId,
					},
				});

				await tx.bookingDocument.create({
					data: {
						bookingId: booking.id,
						type: "workspace_form_unsigned",
						blobId: waBlob.id,
						createdById: adminUser.adminId,
					},
				});
			}

			await tx.auditLog.create({
				data: {
					userId: adminUser.adminId,
					action: "REGENERATE_FORM",
					entity: "service_form",
					entityId: formId,
					metadata: {
						oldFormNumber: existingForm.formNumber,
						newFormNumber,
						bookingId: booking.id,
						bookingReference: booking.referenceNumber,
					},
				},
			});

			return form;
		});

		// Notify user
		try {
			await notifyServiceFormReady({
				userId: booking.user.id,
				formId: updatedForm.id,
				bookingId: booking.id,
				bookingReference: booking.referenceNumber,
				formNumber: newFormNumber,
				validUntil:
					new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
						.toISOString()
						.split("T")[0] ?? "",
				requiresWorkingAreaAgreement: hasWorkspace,
			});
		} catch (notifyError) {
			console.error(
				"[FormRegeneration] Failed to send notification:",
				notifyError,
			);
		}

		return NextResponse.json({
			success: true,
			message: "Service form regenerated successfully",
			serviceForm: {
				id: updatedForm.id,
				formNumber: newFormNumber,
				serviceFormUrl: torUrl,
				workingAreaFormUrl: waUrl,
				validUntil: updatedForm.validUntil.toISOString(),
			},
		});
	} catch (error) {
		console.error("[admin/forms/regenerate] Error:", error);

		if (error instanceof Error) {
			if (error.message === "Unauthorized") {
				return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
			}
			if (error.message.includes("Admin")) {
				return NextResponse.json(
					{ error: "Forbidden: Admin access required" },
					{ status: 403 },
				);
			}
		}

		return NextResponse.json(
			{ error: "Failed to regenerate forms" },
			{ status: 500 },
		);
	}
}
