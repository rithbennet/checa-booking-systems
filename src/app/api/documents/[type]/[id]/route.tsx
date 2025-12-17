/**
 * PDF Document Generation API Route
 * GET /api/documents/[type]/[id]
 *
 * Generates PDF documents for bookings:
 * - invoice: Official invoice with line items, totals, and verification page
 * - work-area: Approval letter with laboratory usage agreement (Appendix A)
 * - service-form: Terms of Reference (TOR) for equipment usage
 */

import { renderToStream } from "@react-pdf/renderer";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/shared/lib/api-factory";
import {
	type CustomerDetails,
	type InvoiceLineItem,
	InvoiceTemplate,
	mapServiceItemsForTOR,
	mapWorkspaceBookingsForTOR,
	type ServiceItemOutput,
	TORTemplate,
	WorkAreaTemplate,
} from "@/shared/lib/pdf";
import { db } from "@/shared/server/db";

type DocumentType = "invoice" | "work-area" | "service-form";

interface RouteParams {
	params: Promise<{
		type: string;
		id: string;
	}>;
}

export async function GET(
	_request: Request,
	{ params }: RouteParams,
): Promise<Response> {
	try {
		// Require admin authentication
		await requireAdmin();

		const { type, id } = await params;

		// Validate document type
		if (!["invoice", "work-area", "service-form"].includes(type)) {
			return NextResponse.json(
				{
					error:
						"Invalid document type. Must be: invoice, work-area, or service-form",
				},
				{ status: 400 },
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
			return NextResponse.json({ error: "Booking not found" }, { status: 404 });
		}

		// Generate the appropriate PDF based on type
		let pdfStream: NodeJS.ReadableStream;
		let filename: string;

		switch (documentType) {
			case "invoice": {
				// Prepare invoice data
				const customerDetails: CustomerDetails = {
					name: `${booking.user.firstName} ${booking.user.lastName}`,
					email: booking.user.email,
					address: booking.user.address ?? "N/A",
					phone: booking.user.phone ?? undefined,
					faculty: booking.user.faculty?.name ?? undefined,
					department: booking.user.department?.name ?? undefined,
				};

				const items: InvoiceLineItem[] = booking.serviceItems.map((item) => ({
					description:
						item.service.name +
						(item.sampleName ? ` - ${item.sampleName}` : ""),
					quantity: item.quantity,
					unitPrice: Number(item.unitPrice),
					total: Number(item.totalPrice),
				}));

				const subtotal = items.reduce((sum, item) => sum + item.total, 0);
				const grandTotal = Number(booking.totalAmount);

				// Get invoice number from service form or generate one
				const serviceForm = booking.serviceForms[0];
				const invoiceNo = serviceForm?.formNumber
					? `INV-${serviceForm.formNumber}`
					: `INV-${booking.referenceNumber}`;

				const dueDate = new Date();
				dueDate.setDate(dueDate.getDate() + 14); // 14 days payment term

				pdfStream = await renderToStream(
					<InvoiceTemplate
						customerDetails={customerDetails}
						date={new Date()}
						dueDate={dueDate}
						grandTotal={grandTotal}
						invoiceNo={invoiceNo}
						items={items}
						referenceNumber={booking.referenceNumber}
						subtotal={subtotal}
					/>,
				);
				filename = `invoice-${invoiceNo}.pdf`;
				break;
			}

			case "work-area": {
				// Validate that booking has workspace reservation
				if (booking.workspaceBookings.length === 0) {
					return NextResponse.json(
						{ error: "This booking does not include a workspace reservation" },
						{ status: 400 },
					);
				}

				const workspaceBooking = booking.workspaceBookings[0];
				if (!workspaceBooking) {
					return NextResponse.json(
						{ error: "Workspace booking data not found" },
						{ status: 400 },
					);
				}

				// Calculate duration
				const startDate = new Date(workspaceBooking.startDate);
				const endDate = new Date(workspaceBooking.endDate);
				const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
				const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
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
							booking.user.faculty?.name ?? booking.user.company?.name ?? "N/A"
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
					return NextResponse.json(
						{
							error:
								"No service items or workspace bookings found for this booking",
						},
						{ status: 400 },
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
				const workspaceUnit = workspaceService?.pricing[0]?.unit ?? "month";

				// Validate workspace service pricing before mapping workspace bookings
				let validatedWorkspaceService = workspaceService;
				let validatedWorkspacePricing: { price: string | number } | undefined;

				if (booking.workspaceBookings.length > 0) {
					const firstWorkspace = booking.workspaceBookings[0];
					if (!firstWorkspace) {
						return NextResponse.json(
							{ error: "Workspace booking data not found" },
							{ status: 400 },
						);
					}

					if (!workspaceService) {
						const startDate = new Date(firstWorkspace.startDate);
						const endDate = new Date(firstWorkspace.endDate);
						const dateRange = `${startDate.toISOString().split("T")[0]} to ${endDate.toISOString().split("T")[0]}`;
						console.warn(
							`[documents/[type]/[id]] Missing workspace service pricing for booking ${booking.id}, workspace ${firstWorkspace.id}, date range: ${dateRange}, userType: ${booking.user.userType}`,
						);
						return NextResponse.json(
							{
								error:
									"Cannot generate document: workspace service pricing not found. Please configure workspace pricing for this user type.",
								details: {
									bookingId: booking.id,
									workspaceId: firstWorkspace.id,
									dateRange,
									userType: booking.user.userType,
								},
							},
							{ status: 400 },
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
						return NextResponse.json(
							{
								error:
									"Cannot generate document: workspace pricing not configured for this user type and date range. Please configure pricing.",
								details: {
									bookingId: booking.id,
									workspaceId: firstWorkspace.id,
									dateRange,
									userType: booking.user.userType,
									serviceId: workspaceService.id,
								},
							},
							{ status: 400 },
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

				// Map service items
				const mappedServiceItems = mapServiceItemsForTOR(booking.serviceItems);
				// Add unit to service items
				const serviceItemsWithUnit = mappedServiceItems.map((item, index) => {
					const serviceId = booking.serviceItems[index]?.serviceId;
					const unit = serviceId ? unitMap.get(serviceId) : undefined;
					return {
						...item,
						unit: unit ?? "samples",
					};
				});

				// Map workspace bookings to service items format
				// Use stored pricing if available (new bookings), otherwise calculate (backward compatibility)
				let workspaceItems: Array<
					ServiceItemOutput & { unit: string }
				> = [];
				if (booking.workspaceBookings.length > 0 && validatedWorkspaceService) {
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
						) as Array<ServiceItemOutput & { unit: string }>;
					} else if (validatedWorkspacePricing) {
						// Fallback: calculate pricing for old bookings without stored pricing
						workspaceItems = mapWorkspaceBookingsForTOR(
							booking.workspaceBookings.map((ws) => {
								// Calculate months
								const startDate = new Date(ws.startDate);
								const endDate = new Date(ws.endDate);
								const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
								const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
								const months = Math.max(1, Math.ceil(diffDays / 30));
								const monthlyRate = Number(validatedWorkspacePricing.price);
								const addOnsTotal = (ws.serviceAddOns || []).reduce(
									(sum, addon) =>
										sum +
										(typeof addon.amount === "object" && "toNumber" in addon.amount
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
						) as Array<ServiceItemOutput & { unit: string }>;
					}
				}

				// Combine service items and workspace bookings
				const allServiceItems = [...serviceItemsWithUnit, ...workspaceItems];

				pdfStream = await renderToStream(
					<TORTemplate
						date={new Date()}
						refNo={refNo}
						serviceItems={allServiceItems}
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

		// Convert stream to buffer
		const chunks: Uint8Array[] = [];
		for await (const chunk of pdfStream) {
			chunks.push(chunk as Uint8Array);
		}
		const pdfBuffer = Buffer.concat(chunks);

		// Return PDF response
		return new Response(pdfBuffer, {
			status: 200,
			headers: {
				"Content-Type": "application/pdf",
				"Content-Disposition": `attachment; filename="${filename}"`,
				"Content-Length": pdfBuffer.length.toString(),
			},
		});
	} catch (error) {
		console.error("[documents/[type]/[id] GET]", error);

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
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
