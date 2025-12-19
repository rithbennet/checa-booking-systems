/**
 * PDF Test Page API Route
 * GET /api/documents/test/[type]
 *
 * Generates PDF documents with sample data for testing:
 * - invoice: Sample invoice with mock line items
 * - work-area: Sample work area approval letter
 * - service-form: Sample TOR document
 */

import { renderToStream } from "@react-pdf/renderer";
import { NextResponse } from "next/server";
import {
	type CustomerDetails,
	type InvoiceLineItem,
	InvoiceTemplate,
	TORTemplate,
	WorkAreaTemplate,
} from "@/shared/lib/pdf";

type DocumentType = "invoice" | "work-area" | "service-form";

interface RouteParams {
	params: Promise<{
		type: string;
	}>;
}

// Sample data for testing
const SAMPLE_CUSTOMER: CustomerDetails = {
	name: "Ahmad bin Abdullah",
	email: "ahmad@student.utm.my",
	address: "MJIIT, UTM Kuala Lumpur, Jalan Sultan Yahya Petra, 54100 KL",
	phone: "+60 12-345 6789",
	faculty: "Malaysia-Japan International Institute of Technology",
	department: "Chemical Engineering",
};

const SAMPLE_ITEMS: InvoiceLineItem[] = [
	{
		description: "FTIR-ATR Analysis - Sample A (Polymer)",
		quantity: 3,
		unitPrice: 50.0,
		total: 150.0,
	},
	{
		description: "UV-Vis Spectroscopy - Sample B",
		quantity: 2,
		unitPrice: 40.0,
		total: 80.0,
	},
	{
		description: "BET Surface Area Analysis",
		quantity: 1,
		unitPrice: 150.0,
		total: 150.0,
	},
	{
		description: "HPLC Analysis - 5 samples",
		quantity: 5,
		unitPrice: 80.0,
		total: 400.0,
	},
];

export async function GET(
	_request: Request,
	{ params }: RouteParams,
): Promise<Response> {
	try {
		const { type } = await params;

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

		let pdfStream: NodeJS.ReadableStream;
		let filename: string;

		const today = new Date();
		const dueDate = new Date();
		dueDate.setDate(dueDate.getDate() + 14);

		switch (documentType) {
			case "invoice": {
				const subtotal = SAMPLE_ITEMS.reduce(
					(sum, item) => sum + item.total,
					0,
				);
				const grandTotal = subtotal;

				pdfStream = await renderToStream(
					<InvoiceTemplate
						customerDetails={SAMPLE_CUSTOMER}
						date={today}
						dueDate={dueDate}
						grandTotal={grandTotal}
						invoiceNo="INV-TEST-2024-001"
						items={SAMPLE_ITEMS}
						referenceNumber="BR-2024-TEST-001"
						subtotal={subtotal}
					/>,
				);
				filename = "test-invoice.pdf";
				break;
			}

			case "work-area": {
				const startDate = today;
				const endDate = new Date();
				endDate.setMonth(endDate.getMonth() + 3);

				pdfStream = await renderToStream(
					<WorkAreaTemplate
						department="Chemical Engineering"
						duration="3 months"
						endDate={endDate}
						faculty="Malaysia-Japan International Institute of Technology"
						purpose="Research on polymer degradation and characterization"
						refNo="WA-TEST-2024-001"
						startDate={startDate}
						studentName="Ahmad bin Abdullah"
						supervisorName="Dr. Siti Aminah binti Hassan"
					/>,
				);
				filename = "test-work-area-approval.pdf";
				break;
			}

			case "service-form": {
				pdfStream = await renderToStream(
					<TORTemplate
						date={today}
						refNo="TOR-TEST-2024-001"
						serviceItems={[
							{
								service: {
									name: "FTIR-ATR Spectrometer",
									code: "ftir-atr",
								},
								quantity: 3,
								unitPrice: 50.0,
								totalPrice: 150.0,
								sampleName: "Sample A (Polymer)",
							},
						]}
						supervisorName="Dr. Siti Aminah binti Hassan"
						userAddress={SAMPLE_CUSTOMER.address}
						userEmail="ahmad@student.utm.my"
						userFaculty="Malaysia-Japan International Institute of Technology"
						userName="Ahmad bin Abdullah"
						userTel={SAMPLE_CUSTOMER.phone ?? ""}
					/>,
				);
				filename = "test-service-form.pdf";
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
				"Content-Disposition": `inline; filename="${filename}"`,
				"Content-Length": pdfBuffer.length.toString(),
			},
		});
	} catch (error) {
		console.error("[documents/test/[type] GET]", error);
		return NextResponse.json(
			{
				error: "Internal server error",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
}
