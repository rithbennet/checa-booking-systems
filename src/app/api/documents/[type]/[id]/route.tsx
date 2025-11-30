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
						facultyRelation: true,
						departmentRelation: true,
						companyRelation: true,
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
					faculty: booking.user.facultyRelation?.name ?? undefined,
					department: booking.user.departmentRelation?.name ?? undefined,
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
						department={booking.user.departmentRelation?.name}
						duration={duration}
						endDate={endDate}
						faculty={
							booking.user.facultyRelation?.name ??
							booking.user.companyRelation?.name ??
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
					/>,
				);
				filename = `work-area-approval-${refNo}.pdf`;
				break;
			}

			case "service-form": {
				// Get the first service item for equipment info
				const serviceItem = booking.serviceItems[0];

				if (!serviceItem) {
					return NextResponse.json(
						{ error: "No service items found for this booking" },
						{ status: 400 },
					);
				}

				const refNo = `TOR-${booking.referenceNumber}`;

				pdfStream = await renderToStream(
					<TORTemplate
						date={new Date()}
						equipmentCode={serviceItem.service.code}
						equipmentName={serviceItem.service.name}
						refNo={refNo}
						supervisorName={booking.user.supervisorName ?? "N/A"}
						userEmail={booking.user.email}
						userFaculty={
							booking.user.facultyRelation?.name ??
							booking.user.companyRelation?.name
						}
						userName={`${booking.user.firstName} ${booking.user.lastName}`}
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
