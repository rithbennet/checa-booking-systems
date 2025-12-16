/**
 * Form Generation API Route
 * POST /api/admin/forms/generate/[bookingId]
 *
 * Generates PDF forms (service form and workspace form) for a booking:
 * 1. Validates booking exists and is in correct status
 * 2. Generates PDFs using @react-pdf/renderer
 * 3. Uploads to UploadThing using UTApi
 * 4. Creates ServiceForm record with document paths
 * 5. Creates BookingDocument records for tracking
 * 6. Notifies user that forms are ready
 */

import { renderToBuffer } from "@react-pdf/renderer";
import { NextResponse } from "next/server";
import { UTFile } from "uploadthing/server";
import { notifyServiceFormReady } from "@/entities/notification/server/form.notifications";
import { requireAdmin } from "@/shared/lib/api-factory";
import { TORTemplate, WorkAreaTemplate } from "@/shared/lib/pdf";
import { facilityConfig } from "@/shared/lib/pdf/config/facility-config";
import { db } from "@/shared/server/db";
import { utapi } from "@/shared/server/uploadthing";

interface RouteParams {
	params: Promise<{
		bookingId: string;
	}>;
}

export async function POST(
	_request: Request,
	{ params }: RouteParams,
): Promise<Response> {
	try {
		// Require admin authentication
		const adminUser = await requireAdmin();
		const { bookingId } = await params;

		// Fetch booking with all related data
		const booking = await db.bookingRequest.findUnique({
			where: { id: bookingId },
			include: {
				user: {
					include: {
						faculty: true,
						department: true,
						ikohza: true,
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
				serviceForms: {
					orderBy: { createdAt: "desc" },
					take: 1,
				},
			},
		});

		if (!booking) {
			return NextResponse.json({ error: "Booking not found" }, { status: 404 });
		}

		// Check if forms were already generated
		const existingForm = booking.serviceForms[0];
		if (existingForm) {
			return NextResponse.json(
				{
					error: "Forms already generated",
					formId: existingForm.id,
					formNumber: existingForm.formNumber,
				},
				{ status: 409 },
			);
		}

		// Booking should be in "approved" status to generate forms
		if (booking.status !== "approved") {
			return NextResponse.json(
				{
					error: `Booking must be approved before generating forms. Current status: ${booking.status}`,
				},
				{ status: 400 },
			);
		}

		// Generate form number
		const formCount = await db.serviceForm.count();
		const formNumber = `SF-${new Date().getFullYear()}-${String(formCount + 1).padStart(5, "0")}`;

		// Calculate totals
		const subtotal = booking.serviceItems.reduce(
			(sum, item) => sum + Number(item.totalPrice),
			0,
		);
		const totalAmount = Number(booking.totalAmount);

		// Check if booking has workspace items (requires working area agreement)
		const hasWorkspace = booking.workspaceBookings.length > 0;

		// Prepare common data
		const userName = `${booking.user.firstName} ${booking.user.lastName}`;
		const userFaculty =
			booking.user.faculty?.name ??
			booking.user.company?.name ??
			booking.user.companyBranch?.name ??
			"N/A";
		const supervisorName = booking.user.supervisorName ?? "N/A";

		// 1. Generate Service Form (TOR) PDF
		const torRefNo = `TOR-${formNumber}`;

		const torPdfBuffer = await renderToBuffer(
			<TORTemplate
				date={new Date()}
				refNo={torRefNo}
				serviceItems={booking.serviceItems.map((item) => ({
					service: {
						name: item.service.name,
						code: item.service.code ?? undefined,
					},
					quantity: item.quantity,
					unitPrice: Number(item.unitPrice),
					totalPrice: Number(item.totalPrice),
					sampleName: item.sampleName ?? undefined,
				}))}
				supervisorName={supervisorName}
				userAddress={booking.user.address ?? ""}
				userDepartment={booking.user.department?.name ?? undefined}
				userEmail={booking.user.email}
				userFaculty={booking.user.faculty?.name ?? undefined}
				userIkohza={booking.user.ikohza?.name ?? undefined}
				userName={userName}
				userTel={booking.user.phone ?? ""}
				userType={booking.user.userType}
				utmLocation={booking.user.UTM ?? undefined}
			/>,
		);

		// Upload TOR PDF to UploadThing
		const torFileName = `service-form-${torRefNo}.pdf`;
		const torFile = new UTFile([new Uint8Array(torPdfBuffer)], torFileName, {
			customId: `tor-${bookingId}`,
		});

		const torUploadResult = await utapi.uploadFiles([torFile]);
		if (torUploadResult[0]?.error || !torUploadResult[0]?.data) {
			console.error(
				"[FormGeneration] TOR upload failed:",
				torUploadResult[0]?.error,
			);
			return NextResponse.json(
				{ error: "Failed to upload service form PDF" },
				{ status: 500 },
			);
		}
		const torUrl = torUploadResult[0].data.ufsUrl;
		const torKey = torUploadResult[0].data.key;

		// 2. Generate Working Area Agreement PDF (if applicable)
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

				const waRefNo = `WA-${formNumber}`;

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
					customId: `wa-${bookingId}`,
				});

				const waUploadResult = await utapi.uploadFiles([waFile]);
				if (waUploadResult[0]?.error || !waUploadResult[0]?.data) {
					console.error(
						"[FormGeneration] WA upload failed:",
						waUploadResult[0]?.error,
					);
					// Don't fail entirely - service form was uploaded successfully
				} else {
					waUrl = waUploadResult[0].data.ufsUrl;
					waKey = waUploadResult[0].data.key;
				}
			}
		}

		// 3. Create database records in a transaction
		const result = await db.$transaction(async (tx) => {
			// Create ServiceForm record
			const serviceForm = await tx.serviceForm.create({
				data: {
					bookingRequestId: bookingId,
					formNumber,
					facilityLab: facilityConfig.facilityName,
					subtotal,
					totalAmount,
					validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
					status: "generated",
					serviceFormUnsignedPdfPath: torUrl,
					requiresWorkingAreaAgreement: hasWorkspace,
					workingAreaAgreementUnsignedPdfPath: waUrl,
					generatedBy: adminUser.adminId,
				},
			});

			// Create FileBlob and BookingDocument for TOR
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
					bookingId,
					type: "service_form_unsigned",
					blobId: torBlob.id,
					createdById: adminUser.adminId,
				},
			});

			// Create FileBlob and BookingDocument for Working Area if applicable
			if (waUrl && waKey) {
				const waBlob = await tx.fileBlob.create({
					data: {
						key: waKey,
						url: waUrl,
						mimeType: "application/pdf",
						fileName: `working-area-WA-${formNumber}.pdf`,
						sizeBytes: 0, // We don't have the size easily
						uploadedById: adminUser.adminId,
					},
				});

				await tx.bookingDocument.create({
					data: {
						bookingId,
						type: "workspace_form_unsigned",
						blobId: waBlob.id,
						createdById: adminUser.adminId,
					},
				});
			}

			return serviceForm;
		});

		// 4. Send notification to user
		const validUntilDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
		try {
			await notifyServiceFormReady({
				userId: booking.user.id,
				formId: result.id,
				bookingId,
				bookingReference: booking.referenceNumber,
				formNumber,
				validUntil: validUntilDate.toISOString().split("T")[0] ?? "",
				requiresWorkingAreaAgreement: hasWorkspace,
			});
		} catch (notifyError) {
			// Don't fail the request if notification fails
			console.error(
				"[FormGeneration] Failed to send notification:",
				notifyError,
			);
		}

		return NextResponse.json({
			success: true,
			serviceForm: {
				id: result.id,
				formNumber: result.formNumber,
				serviceFormUrl: torUrl,
				workingAreaFormUrl: waUrl,
				validUntil: result.validUntil.toISOString(),
			},
		});
	} catch (error) {
		console.error("[admin/forms/generate] Error:", error);

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
			{ error: "Failed to generate forms" },
			{ status: 500 },
		);
	}
}
