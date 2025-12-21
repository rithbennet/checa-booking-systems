/**
 * PDF Document Generation API Route
 * GET /api/documents/[type]/[id]
 *
 * Generates PDF documents for bookings:
 * - work-area: Approval letter with laboratory usage agreement (Appendix A)
 * - service-form: Terms of Reference (TOR) for equipment usage
 */

import { renderToStream } from "@react-pdf/renderer";
import { getEffectiveFacilityConfigForPdf } from "@/entities/document-config";
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
	type ServiceItemOutput,
	TORTemplate,
	WorkAreaTemplate,
} from "@/shared/lib/pdf";
import { db } from "@/shared/server/db";

type DocumentType = "work-area" | "service-form";

/**
 * Timeout-protected stream-to-buffer helper
 * Converts a readable stream to a buffer with timeout protection
 */
async function streamToBufferWithTimeout(
	stream: NodeJS.ReadableStream,
	timeoutMs = 30000,
): Promise<Buffer> {
	return new Promise((resolve, reject) => {
		const chunks: Uint8Array[] = [];
		let completed = false;

		const timeoutId = setTimeout(() => {
			if (!completed) {
				completed = true;
				const timeoutError = new Error(`Stream timeout after ${timeoutMs}ms`);
				// Destroy stream to release resources and prevent further data events
				if (
					typeof (
						stream as NodeJS.ReadableStream & {
							destroy?: (error?: Error) => void;
						}
					).destroy === "function"
				) {
					(
						stream as NodeJS.ReadableStream & {
							destroy: (error?: Error) => void;
						}
					).destroy(timeoutError);
				} else {
					stream.removeAllListeners();
				}
				reject(timeoutError);
			}
		}, timeoutMs);

		const cleanup = () => {
			clearTimeout(timeoutId);
			completed = true;
		};

		stream.on("data", (chunk: Uint8Array) => {
			chunks.push(chunk);
		});

		stream.on("end", () => {
			if (!completed) {
				cleanup();
				resolve(Buffer.concat(chunks));
			}
		});

		stream.on("error", (error: Error) => {
			if (!completed) {
				cleanup();
				reject(error);
			}
		});
	});
}

export const GET = createProtectedHandler(
	async (_request: Request, user, { params }) => {
		try {
			if (user.role !== "lab_administrator") return forbidden();

			const type = params?.type as string;
			const id = params?.id as string;

			if (!id) {
				return badRequest("Document ID is required");
			}

			// Validate document type
			if (!["work-area", "service-form"].includes(type)) {
				return badRequest(
					"Invalid document type. Must be: work-area or service-form",
				);
			}

			const documentType = type as DocumentType;

			// Fetch booking with all related data
			const booking = await db.bookingRequest.findUnique({
				where: { id },
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

			// Get effective facility config from document config
			const facilityConfig = await getEffectiveFacilityConfigForPdf();

			// Generate the appropriate PDF based on type
			let pdfStream: NodeJS.ReadableStream;
			let filename: string;

			switch (documentType) {
				case "work-area": {
					// Validate that booking has workspace reservation
					if (booking.workspaceBookings.length === 0) {
						return badRequest(
							"This booking does not include a workspace reservation",
						);
					}

					const workspaceBooking = booking.workspaceBookings[0];
					if (!workspaceBooking) {
						return badRequest("Workspace booking data not found");
					}

					// Calculate duration (inclusive: includes both start and end dates)
					// Example: Jan 1 to Jan 3 = 3 days (Jan 1, Jan 2, Jan 3)
					const startDate = new Date(workspaceBooking.startDate);
					const endDate = new Date(workspaceBooking.endDate);
					const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
					const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
					const duration =
						diffDays > 30
							? `${Math.ceil(diffDays / 30)} month(s)`
							: `${diffDays} day(s)`;

					const refNo = `WA-${booking.referenceNumber}`;

					pdfStream = await renderToStream(
						<WorkAreaTemplate
							department={booking.user.department?.name}
							duration={duration}
							endDate={endDate}
							faculty={
								booking.user.faculty?.name ??
								booking.user.company?.name ??
								"N/A"
							}
							purpose={
								booking.projectDescription ??
								workspaceBooking.purpose ??
								undefined
							}
							refNo={refNo}
							startDate={startDate}
							studentName={`${booking.user.firstName} ${booking.user.lastName}`}
							supervisorName={booking.user.supervisorName ?? "N/A"}
							workAreaConfig={facilityConfig.workArea}
						/>,
					);
					filename = `work-area-approval-${refNo}.pdf`;
					break;
				}

				case "service-form": {
					// Check if booking has service items or workspace bookings
					if (
						booking.serviceItems.length === 0 &&
						booking.workspaceBookings.length === 0
					) {
						return badRequest(
							"No service items or workspace bookings found for this booking",
						);
					}

					const refNo = `TOR-${booking.referenceNumber}`;
					const userName = `${booking.user.firstName} ${booking.user.lastName}`;

					// Fetch service pricing to get units for service items
					const serviceIds = booking.serviceItems.map((item) => item.serviceId);
					const servicePricings =
						serviceIds.length > 0
							? await db.servicePricing.findMany({
								where: {
									serviceId: { in: serviceIds },
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
							})
							: [];

					// Create a map of serviceId -> unit (get most recent pricing for each service)
					const unitMap = new Map<string, string>();
					for (const pricing of servicePricings) {
						if (!unitMap.has(pricing.serviceId)) {
							unitMap.set(pricing.serviceId, pricing.unit);
						}
					}

					// Fetch workspace service pricing for unit
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
					const workspaceUnit = "months"; // Workarea is always billed in months

					// Validate workspace service pricing before mapping workspace bookings
					let validatedWorkspaceService = workspaceService;
					let validatedWorkspacePricing: { price: string | number } | undefined;

					if (booking.workspaceBookings.length > 0) {
						const firstWorkspace = booking.workspaceBookings[0];
						if (!firstWorkspace) {
							return badRequest("Workspace booking data not found");
						}

						if (!workspaceService) {
							const startDate = new Date(firstWorkspace.startDate);
							const endDate = new Date(firstWorkspace.endDate);
							const dateRange = `${startDate.toISOString().split("T")[0]} to ${endDate.toISOString().split("T")[0]}`;
							console.warn(
								`[documents/[type]/[id]] Missing workspace service pricing for booking ${booking.id}, workspace ${firstWorkspace.id}, date range: ${dateRange}, userType: ${booking.user.userType}`,
							);
							return badRequest(
								`Cannot generate document: workspace service pricing not found. Please configure workspace pricing for this user type. Booking ID: ${booking.id}, Workspace ID: ${firstWorkspace.id}, Date Range: ${dateRange}, User Type: ${booking.user.userType}`,
							);
						}

						if (
							!workspaceService.pricing ||
							workspaceService.pricing.length === 0
						) {
							const startDate = new Date(firstWorkspace.startDate);
							const endDate = new Date(firstWorkspace.endDate);
							const dateRange = `${startDate.toISOString().split("T")[0]} to ${endDate.toISOString().split("T")[0]}`;
							console.warn(
								`[documents/[type]/[id]] Missing workspace service pricing entry for booking ${booking.id}, workspace ${firstWorkspace.id}, date range: ${dateRange}, userType: ${booking.user.userType}, serviceId: ${workspaceService.id}`,
							);
							return badRequest(
								`Cannot generate document: workspace pricing not configured for this user type and date range. Please configure pricing. Booking ID: ${booking.id}, Workspace ID: ${firstWorkspace.id}, Date Range: ${dateRange}, User Type: ${booking.user.userType}, Service ID: ${workspaceService.id}`,
							);
						}

						// Store validated values for use in map function
						validatedWorkspaceService = workspaceService;
						const firstPricing = workspaceService.pricing[0];
						validatedWorkspacePricing =
							firstPricing?.price != null
								? { price: firstPricing.price.toNumber() }
								: undefined;
					}

					// Map service items (includes add-ons as separate TOR line items)
					const serviceItemsWithUnit = mapServiceItemsForTOR(
						booking.serviceItems,
						unitMap,
					);

					// Map workspace bookings to service items format
					// Use stored pricing if available (new bookings), otherwise calculate (backward compatibility)
					let workspaceItems: ServiceItemOutput[] = [];
					if (
						booking.workspaceBookings.length > 0 &&
						validatedWorkspaceService
					) {
						// Check if workspace bookings have stored pricing (new schema)
						const hasStoredPricing = booking.workspaceBookings.some(
							(ws) => ws.unitPrice && ws.totalPrice,
						);

						if (hasStoredPricing) {
							// Use stored pricing
							workspaceItems = mapWorkspaceBookingsForTOR(
								booking.workspaceBookings.map((ws) => ({
									startDate: ws.startDate,
									endDate: ws.endDate,
									unitPrice: ws.unitPrice,
									totalPrice: ws.totalPrice,
									serviceAddOns: ws.serviceAddOns,
								})),
								{
									name: validatedWorkspaceService.name,
									code: validatedWorkspaceService.code,
									unit: workspaceUnit,
								},
							);
						} else if (validatedWorkspacePricing) {
							// Fallback: calculate pricing for old bookings without stored pricing
							workspaceItems = mapWorkspaceBookingsForTOR(
								booking.workspaceBookings.map((ws) => {
									// Calculate months (inclusive: includes both start and end dates)
									// Example: Jan 1 to Jan 3 = 3 days, Jan 1 to Jan 31 = 31 days = 2 months
									const startDate = new Date(ws.startDate);
									const endDate = new Date(ws.endDate);
									const diffTime = Math.abs(
										endDate.getTime() - startDate.getTime(),
									);
									const diffDays =
										Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
									// Ensure minimum 1 month for pricing (handles same-day bookings)
									const months = Math.max(1, Math.ceil(diffDays / 30));
									const monthlyRate = Number(validatedWorkspacePricing.price);
									const addOnsTotal = (ws.serviceAddOns || []).reduce(
										(sum, addon) =>
											sum +
											(typeof addon.amount === "object" &&
												"toNumber" in addon.amount
												? addon.amount.toNumber()
												: Number(addon.amount)),
										0,
									);

									return {
										startDate: ws.startDate,
										endDate: ws.endDate,
										unitPrice: monthlyRate,
										totalPrice: monthlyRate * months + addOnsTotal,
										serviceAddOns: ws.serviceAddOns,
									};
								}),
								{
									name: validatedWorkspaceService.name,
									code: validatedWorkspaceService.code,
									unit: workspaceUnit,
								},
							);
						}
					}

					// Combine service items and workspace bookings
					const allServiceItems = [...serviceItemsWithUnit, ...workspaceItems];

					pdfStream = await renderToStream(
						<TORTemplate
							date={new Date()}
							facilityName={facilityConfig.facilityName}
							refNo={refNo}
							serviceItems={allServiceItems}
							staffPicEmail={facilityConfig.staffPic.email}
							staffPicFullName={facilityConfig.staffPic.fullName}
							staffPicName={facilityConfig.staffPic.name}
							staffPicSignatureImageUrl={
								facilityConfig.staffPic.signatureImageUrl
							}
							supervisorName={booking.user.supervisorName ?? "N/A"}
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
					filename = `service-form-${refNo}.pdf`;
					break;
				}
			}

			// Convert stream to buffer with timeout protection
			const pdfBuffer = await streamToBufferWithTimeout(pdfStream, 30000);

			// Return PDF response (createProtectedHandler will pass through Response objects)
			// Use Uint8Array.from to convert Buffer for Response compatibility
			return new Response(Uint8Array.from(pdfBuffer), {
				status: 200,
				headers: {
					"Content-Type": "application/pdf",
					"Content-Disposition": `attachment; filename="${filename}"`,
					"Content-Length": pdfBuffer.length.toString(),
				},
			});
		} catch (error) {
			console.error("[documents/[type]/[id] GET]", error);
			return serverError("Internal server error");
		}
	},
);
