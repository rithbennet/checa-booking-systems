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

			const bookingId = params?.bookingId as string;

			if (!bookingId) {
				return badRequest("Booking ID is required");
			}

			// Get effective facility config from document config
			const facilityConfig = await getEffectiveFacilityConfigForPdf();

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
					serviceForms: {
						orderBy: { createdAt: "desc" },
						take: 1,
					},
				},
			});

			if (!booking) {
				return notFound("Booking not found");
			}

			// Check if forms were already generated
			const existingForm = booking.serviceForms[0];
			if (existingForm) {
				return badRequest(
					`Forms already generated. Form ID: ${existingForm.id}, Form Number: ${existingForm.formNumber}`,
				);
			}

			// Booking should be in "approved" status to generate forms
			if (booking.status !== "approved") {
				return badRequest(
					`Booking must be approved before generating forms. Current status: ${booking.status}`,
				);
			}

			// Generate form number using last form's number to avoid race conditions
			// Find the highest existing form number for this year
			const currentYear = new Date().getFullYear();
			const yearPrefix = `SF-${currentYear}-`;
			const lastForm = await db.serviceForm.findFirst({
				where: {
					formNumber: {
						startsWith: yearPrefix,
					},
				},
				orderBy: {
					formNumber: "desc",
				},
				select: { formNumber: true },
			});

			let nextNumber = 1;
			if (lastForm?.formNumber) {
				// Extract the 5-digit sequential number from formats like SF-YYYY-00001
				const match = lastForm.formNumber.match(/-(\d{5})$/);
				if (match?.[1]) {
					nextNumber = parseInt(match[1], 10) + 1;
				}
			}
			const formNumber = `${yearPrefix}${String(nextNumber).padStart(5, "0")}`;

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
					const _workspaceServiceName =
						workspaceService?.name ?? "Working Space";
					const _workspaceServiceCode = workspaceService?.code ?? "N/A";

					console.warn(
						`[admin/forms/generate/[bookingId]] Missing workspace service pricing for booking ${bookingId}, workspace ${firstWorkspace.id}, date range: ${dateRange}, userType: ${booking.user.userType}, serviceId: ${workspaceService?.id ?? "N/A"}`,
					);

					return badRequest(
						`Cannot generate document: workspace pricing not configured for this user type and date range. Please configure pricing. Booking ID: ${bookingId}, Workspace ID: ${firstWorkspace.id}, Date Range: ${dateRange}, User Type: ${booking.user.userType}`,
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

			// 1. Generate Service Form (TOR) PDF
			const torRefNo = `TOR-${formNumber}`;

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
				return serverError("Failed to upload service form PDF");
			}
			const torUrl = torUploadResult[0].data.ufsUrl;
			const torKey = torUploadResult[0].data.key;

			// 2. Generate Working Area Agreement PDF (if applicable)
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
					const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
					const duration =
						diffDays > 30
							? `${Math.ceil(diffDays / 30)} month(s)`
							: `${diffDays} day(s)`;

					const waRefNo = `WA-${formNumber}`;

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
						customId: `wa-${bookingId}`,
					});

					const waUploadResult = await utapi.uploadFiles([waFile]);
					if (waUploadResult[0]?.error || !waUploadResult[0]?.data) {
						workingAreaUploadFailed = true;
						workingAreaUploadError =
							waUploadResult[0]?.error?.message ?? "Unknown upload error";
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
			// Wrap in try/catch to cleanup uploaded files if transaction fails
			let result: Awaited<ReturnType<typeof db.serviceForm.create>>;
			try {
				result = await db.$transaction(async (tx) => {
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
							generatedBy: user.id,
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
							uploadedById: user.id,
						},
					});

					await tx.bookingDocument.create({
						data: {
							bookingId,
							type: "service_form_unsigned",
							blobId: torBlob.id,
							createdById: user.id,
						},
					});

					// Create FileBlob and BookingDocument for Working Area if applicable
					if (waUrl && waKey && waPdfBuffer) {
						const waBlob = await tx.fileBlob.create({
							data: {
								key: waKey,
								url: waUrl,
								mimeType: "application/pdf",
								fileName: `working-area-WA-${formNumber}.pdf`,
								sizeBytes: waPdfBuffer.byteLength,
								uploadedById: user.id,
							},
						});

						await tx.bookingDocument.create({
							data: {
								bookingId,
								type: "workspace_form_unsigned",
								blobId: waBlob.id,
								createdById: user.id,
							},
						});
					}

					return serviceForm;
				});
			} catch (txError) {
				// Transaction failed - cleanup uploaded files to prevent orphans
				const keysToDelete = [torKey, waKey].filter((k): k is string =>
					Boolean(k),
				);
				if (keysToDelete.length > 0) {
					try {
						await utapi.deleteFiles(keysToDelete);
					} catch (deleteError) {
						console.error(
							"[FormGeneration] Failed to cleanup uploaded files after transaction failure:",
							deleteError,
						);
					}
				}
				throw txError;
			}

			// 4. Send notification to user - use persisted validUntil from result
			try {
				// Extract YYYY-MM-DD from ISO string (first 10 characters)
				const validUntilDate = result.validUntil.toISOString().slice(0, 10);
				await notifyServiceFormReady({
					userId: booking.user.id,
					formId: result.id,
					bookingId,
					bookingReference: booking.referenceNumber,
					formNumber,
					validUntil: validUntilDate,
					requiresWorkingAreaAgreement: hasWorkspace,
				});
			} catch (notifyError) {
				// Don't fail the request if notification fails
				console.error(
					"[FormGeneration] Failed to send notification:",
					notifyError,
				);
			}

			return Response.json({
				success: true,
				serviceForm: {
					id: result.id,
					formNumber: result.formNumber,
					serviceFormUrl: torUrl,
					workingAreaFormUrl: waUrl,
					validUntil: result.validUntil.toISOString(),
					...(workingAreaUploadFailed && {
						workingAreaUploadFailed: true,
						workingAreaUploadError,
					}),
				},
			});
		} catch (error) {
			console.error("[admin/forms/generate] Error:", error);
			return serverError("Failed to generate forms");
		}
	},
);
