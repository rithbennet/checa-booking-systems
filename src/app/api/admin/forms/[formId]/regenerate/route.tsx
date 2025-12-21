/**
 * Service Form Regeneration API
 * POST /api/admin/forms/[formId]/regenerate
 *
 * Allows admin to regenerate service forms for a booking.
 */

import { renderToBuffer } from "@react-pdf/renderer";
import { UTFile } from "uploadthing/server";
import { getEffectiveFacilityConfigForPdf } from "@/entities/document-config";
import { notifyServiceFormReady } from "@/entities/notification/server/form.notifications";
import {
	badRequest,
	createProtectedHandler,
	forbidden,
	notFound,
	serverError,
} from "@/shared/lib/api-factory";
import {
	mapServiceItemsForTOR,
	mapWorkspaceBookingsForTOR,
	TORTemplate,
	WorkAreaTemplate,
} from "@/shared/lib/pdf";
import { db } from "@/shared/server/db";
import { utapi } from "@/shared/server/uploadthing";

export const POST = createProtectedHandler(
	async (_request: Request, user, { params }) => {
		try {
			if (user.role !== "lab_administrator") return forbidden();

			const formId = params?.formId as string;

			if (!formId) {
				return badRequest("Form ID is required");
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
									ikohza: true,
									company: true,
									companyBranch: true,
								},
							},
							serviceItems: {
								include: {
									service: true,
									serviceAddOns: true,
								},
							},
							workspaceBookings: {
								include: {
									equipmentUsages: {
										include: {
											equipment: true,
										},
									},
									serviceAddOns: true,
								},
							},
						},
					},
				},
			});

			if (!existingForm) {
				return notFound("Service form not found");
			}

			const booking = existingForm.bookingRequest;

			// Get effective facility config from document config
			const facilityConfig = await getEffectiveFacilityConfigForPdf();

			// Generate new form number (increment version)
			const baseNumber = existingForm.formNumber.replace(/-v\d+$/, "");
			// Fetch existing forms to determine the max version number
			const existingForms = await db.serviceForm.findMany({
				where: {
					formNumber: {
						startsWith: baseNumber,
					},
				},
				select: { formNumber: true },
			});
			// Extract version numbers and find the maximum
			const versionRegex = /-v(\d+)$/;
			const maxVersion = existingForms.reduce((max, form) => {
				const match = form.formNumber.match(versionRegex);
				const version = match ? parseInt(match[1] ?? "0", 10) : 0;
				return Math.max(max, version);
			}, 0);
			const newFormNumber = `${baseNumber}-v${maxVersion + 1}`;

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

			// Fetch workspace service info (name, code, unit) if workspace bookings exist
			// Pricing is already stored in workspace bookings, so we only need service metadata
			let workspaceServiceInfo:
				| {
					name: string | null;
					code: string | null;
					unit: string;
				}
				| undefined;

			if (hasWorkspace) {
				const workspaceService = await db.service.findFirst({
					where: { category: "working_space" },
					include: {
						pricing: {
							where: {
								userType: booking.user.userType as
									| "mjiit_member"
									| "utm_member"
									| "external_member"
									| "lab_administrator",
								effectiveFrom: {
									lte: new Date(),
								},
								OR: [
									{ effectiveTo: null },
									{ effectiveTo: { gte: new Date() } },
								],
							},
							orderBy: {
								effectiveFrom: "desc",
							},
							take: 1,
						},
					},
				});

				if (workspaceService?.pricing?.[0]) {
					workspaceServiceInfo = {
						name: workspaceService.name,
						code: workspaceService.code,
						unit: "months", // Workarea is always billed in months
					};
				} else {
					// Workspace bookings exist but pricing configuration is missing
					const firstWorkspace = booking.workspaceBookings[0];
					if (!firstWorkspace) {
						return badRequest("Workspace booking data not found");
					}

					const startDate = new Date(firstWorkspace.startDate);
					const endDate = new Date(firstWorkspace.endDate);
					const dateRange = `${startDate.toISOString().split("T")[0]} to ${endDate.toISOString().split("T")[0]}`;

					console.warn(
						`[admin/forms/regenerate] Missing workspace service pricing for booking ${booking.id}, workspace ${firstWorkspace.id}, date range: ${dateRange}, userType: ${booking.user.userType}, serviceId: ${workspaceService?.id ?? "N/A"}`,
					);

					return badRequest(
						`Cannot generate document: workspace pricing not configured for this user type and date range. Please configure pricing. Booking ID: ${booking.id}, Workspace ID: ${firstWorkspace.id}, Date Range: ${dateRange}, User Type: ${booking.user.userType}`,
					);
				}
			}

			// Map service items
			const mappedServiceItems = mapServiceItemsForTOR(booking.serviceItems);

			// Map workspace bookings if available (using stored pricing)
			let workspaceItems: typeof mappedServiceItems = [];
			if (hasWorkspace && workspaceServiceInfo) {
				workspaceItems = mapWorkspaceBookingsForTOR(
					booking.workspaceBookings.map((ws) => ({
						startDate: ws.startDate,
						endDate: ws.endDate,
						unitPrice: ws.unitPrice,
						totalPrice: ws.totalPrice,
						serviceAddOns: ws.serviceAddOns,
					})),
					workspaceServiceInfo,
				);
			}

			// Combine service items and workspace bookings
			const allServiceItems = [...mappedServiceItems, ...workspaceItems];

			// Generate Service Form (TOR) PDF
			const torRefNo = `TOR-${newFormNumber}`;

			const torPdfBuffer = await renderToBuffer(
				<TORTemplate
					date={new Date()}
					facilityName={facilityConfig.facilityName}
					refNo={torRefNo}
					serviceItems={allServiceItems}
					staffPicEmail={facilityConfig.staffPic.email}
					staffPicFullName={facilityConfig.staffPic.fullName}
					staffPicName={facilityConfig.staffPic.name}
					staffPicSignatureImageUrl={facilityConfig.staffPic.signatureImageUrl}
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
				return serverError("Failed to upload regenerated service form PDF");
			}
			const torUrl = torUploadResult[0].data.ufsUrl;
			const torKey = torUploadResult[0].data.key;

			// Generate Working Area Agreement PDF (if applicable)
			let waUrl: string | null = null;
			let waKey: string | null = null;
			let waPdfBuffer: Buffer | null = null;
			let workingAreaUploadFailed = false;
			let workingAreaUploadError: string | null = null;

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

					waPdfBuffer = await renderToBuffer(
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
							workAreaConfig={facilityConfig.workArea}
						/>,
					);

					const waFileName = `working-area-${waRefNo}.pdf`;
					const waFile = new UTFile([new Uint8Array(waPdfBuffer)], waFileName, {
						customId: `wa-${booking.id}-${Date.now()}`,
					});

					const waUploadResult = await utapi.uploadFiles([waFile]);
					if (waUploadResult[0]?.error || !waUploadResult[0]?.data) {
						workingAreaUploadFailed = true;
						workingAreaUploadError =
							waUploadResult[0]?.error?.message ?? "Unknown upload error";
						console.error(
							"[FormRegeneration] WA upload failed:",
							waUploadResult[0]?.error,
						);
						// Don't fail entirely - service form was uploaded successfully
					} else {
						waUrl = waUploadResult[0].data.ufsUrl;
						waKey = waUploadResult[0].data.key;
					}
				}
			}

			// Update the existing form with new paths and delete old records atomically
			const { updatedForm, oldBlobKeys } = await db.$transaction(async (tx) => {
				// Find old documents and collect blob keys inside transaction
				const oldDocuments = await tx.bookingDocument.findMany({
					where: {
						bookingId: booking.id,
						type: {
							in: ["service_form_unsigned", "workspace_form_unsigned"],
						},
					},
					include: {
						blob: true,
					},
				});

				// Collect old blob keys for external deletion (after transaction commits)
				const blobKeys: string[] = [];
				for (const doc of oldDocuments) {
					if (doc.blob?.key) {
						blobKeys.push(doc.blob.key);
					}
				}

				// Delete old BookingDocument and FileBlob records first
				if (oldDocuments.length > 0) {
					// Delete BookingDocument records
					await tx.bookingDocument.deleteMany({
						where: {
							id: {
								in: oldDocuments.map((d) => d.id),
							},
						},
					});

					// Delete FileBlob records
					await tx.fileBlob.deleteMany({
						where: {
							id: {
								in: oldDocuments.map((d) => d.blobId),
							},
						},
					});
				}
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
						generatedBy: user.id,
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
						uploadedById: user.id,
					},
				});

				await tx.bookingDocument.create({
					data: {
						bookingId: booking.id,
						type: "service_form_unsigned",
						blobId: torBlob.id,
						createdById: user.id,
					},
				});

				if (waUrl && waKey && waPdfBuffer) {
					const waBlob = await tx.fileBlob.create({
						data: {
							key: waKey,
							url: waUrl,
							mimeType: "application/pdf",
							fileName: `working-area-WA-${newFormNumber}.pdf`,
							sizeBytes: waPdfBuffer.byteLength,
							uploadedById: user.id,
						},
					});

					await tx.bookingDocument.create({
						data: {
							bookingId: booking.id,
							type: "workspace_form_unsigned",
							blobId: waBlob.id,
							createdById: user.id,
						},
					});
				}

				await tx.auditLog.create({
					data: {
						userId: user.id,
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

				return { updatedForm: form, oldBlobKeys: blobKeys };
			});

			// Delete old files from UploadThing storage after successful DB transaction
			if (oldBlobKeys.length > 0) {
				try {
					await utapi.deleteFiles(oldBlobKeys);
				} catch (error) {
					console.error(
						"[FormRegeneration] Failed to delete old files from UploadThing:",
						error,
					);
					// Log error but don't rollback - DB transaction already committed
				}
			}

			// Notify user - use persisted validUntil from updatedForm
			try {
				await notifyServiceFormReady({
					userId: booking.user.id,
					formId: updatedForm.id,
					bookingId: booking.id,
					bookingReference: booking.referenceNumber,
					formNumber: newFormNumber,
					validUntil: updatedForm.validUntil.toISOString().slice(0, 10),
					requiresWorkingAreaAgreement: hasWorkspace,
				});
			} catch (notifyError) {
				console.error(
					"[FormRegeneration] Failed to send notification:",
					notifyError,
				);
			}

			return Response.json({
				success: true,
				message: "Service form regenerated successfully",
				serviceForm: {
					id: updatedForm.id,
					formNumber: newFormNumber,
					serviceFormUrl: torUrl,
					workingAreaFormUrl: waUrl,
					validUntil: updatedForm.validUntil.toISOString(),
					...(workingAreaUploadFailed && {
						workingAreaUploadFailed: true,
						workingAreaUploadError,
					}),
				},
			});
		} catch (error) {
			console.error("[admin/forms/regenerate] Error:", error);
			return serverError("Failed to regenerate forms");
		}
	},
);
