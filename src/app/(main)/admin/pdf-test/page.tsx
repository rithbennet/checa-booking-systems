"use client";

/**
 * PDF Test Page
 * Allows testing and previewing all PDF document types
 */

import { Download, Eye, FileText, Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/shared/ui/shadcn/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/shared/ui/shadcn/card";

type DocumentType = "invoice" | "work-area" | "service-form";

interface DocumentInfo {
	type: DocumentType;
	title: string;
	description: string;
	icon: React.ReactNode;
}

const DOCUMENT_TYPES: DocumentInfo[] = [
	{
		type: "invoice",
		title: "Invoice",
		description:
			"Official invoice with line items, totals, terms & conditions, and verification page",
		icon: <FileText className="h-8 w-8 text-blue-500" />,
	},
	{
		type: "work-area",
		title: "Work Area Approval",
		description:
			"Formal approval letter with laboratory usage agreement (Appendix A)",
		icon: <FileText className="h-8 w-8 text-green-500" />,
	},
	{
		type: "service-form",
		title: "Service Form / TOR",
		description:
			"Terms of Reference document with equipment-specific terms and signature slots",
		icon: <FileText className="h-8 w-8 text-purple-500" />,
	},
];

export default function PDFTestPage() {
	const [loading, setLoading] = useState<DocumentType | null>(null);
	const [error, setError] = useState<string | null>(null);

	const handlePreview = async (type: DocumentType) => {
		setLoading(type);
		setError(null);

		try {
			const response = await fetch(`/api/documents/test/${type}`);

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to generate PDF");
			}

			// Get the PDF blob
			const blob = await response.blob();

			// Open in new tab
			const url = URL.createObjectURL(blob);
			window.open(url, "_blank");

			// Clean up
			setTimeout(() => URL.revokeObjectURL(url), 1000);
		} catch (err) {
			setError(err instanceof Error ? err.message : "An error occurred");
		} finally {
			setLoading(null);
		}
	};

	const handleDownload = async (type: DocumentType) => {
		setLoading(type);
		setError(null);

		try {
			const response = await fetch(`/api/documents/test/${type}`);

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to generate PDF");
			}

			// Get the PDF blob
			const blob = await response.blob();

			// Get filename from content-disposition header
			const contentDisposition = response.headers.get("content-disposition");
			const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
			const filename = filenameMatch?.[1] ?? `test-${type}.pdf`;

			// Download the file
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = filename;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);

			// Clean up
			setTimeout(() => URL.revokeObjectURL(url), 1000);
		} catch (err) {
			setError(err instanceof Error ? err.message : "An error occurred");
		} finally {
			setLoading(null);
		}
	};

	return (
		<div className="container mx-auto px-4 py-10">
			<div className="mb-8">
				<h1 className="font-bold text-3xl text-slate-900">
					PDF Generation Test Page
				</h1>
				<p className="mt-2 text-slate-500">
					Test and preview all PDF document types with sample data. These
					documents will be generated using the @react-pdf/renderer library.
				</p>
			</div>

			{error && (
				<div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
					<p className="text-red-700">{error}</p>
				</div>
			)}

			<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
				{DOCUMENT_TYPES.map((doc) => (
					<Card className="flex flex-col" key={doc.type}>
						<CardHeader>
							<div className="flex items-start gap-4">
								<div className="rounded-lg bg-slate-100 p-2">{doc.icon}</div>
								<div>
									<CardTitle className="text-lg">{doc.title}</CardTitle>
									<CardDescription className="mt-1">
										{doc.description}
									</CardDescription>
								</div>
							</div>
						</CardHeader>
						<CardContent className="flex flex-1 flex-col justify-end">
							<div className="flex gap-3">
								<Button
									className="flex-1"
									disabled={loading !== null}
									onClick={() => handlePreview(doc.type)}
									variant="outline"
								>
									{loading === doc.type ? (
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									) : (
										<Eye className="mr-2 h-4 w-4" />
									)}
									Preview
								</Button>
								<Button
									className="flex-1"
									disabled={loading !== null}
									onClick={() => handleDownload(doc.type)}
								>
									{loading === doc.type ? (
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									) : (
										<Download className="mr-2 h-4 w-4" />
									)}
									Download
								</Button>
							</div>
						</CardContent>
					</Card>
				))}
			</div>

			<div className="mt-10 rounded-lg border border-slate-200 bg-slate-50 p-6">
				<h2 className="mb-4 font-semibold text-slate-900 text-xl">
					API Endpoints
				</h2>
				<div className="space-y-4 font-mono text-sm">
					<div className="rounded border bg-white p-3">
						<p className="mb-1 text-slate-500">
							Test endpoints (no auth required):
						</p>
						<p className="text-blue-600">GET /api/documents/test/invoice</p>
						<p className="text-blue-600">GET /api/documents/test/work-area</p>
						<p className="text-blue-600">
							GET /api/documents/test/service-form
						</p>
					</div>
					<div className="rounded border bg-white p-3">
						<p className="mb-1 text-slate-500">
							Production endpoints (admin auth required):
						</p>
						<p className="text-green-600">
							GET /api/documents/invoice/[bookingId]
						</p>
						<p className="text-green-600">
							GET /api/documents/work-area/[bookingId]
						</p>
						<p className="text-green-600">
							GET /api/documents/service-form/[bookingId]
						</p>
					</div>
				</div>
			</div>

			<div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
				<h3 className="mb-2 font-semibold text-amber-800">
					Note about Logo Images
				</h3>
				<p className="text-amber-700 text-sm">
					The PDF templates reference logo images at{" "}
					<code className="rounded bg-amber-100 px-1">
						/images/utm-logo.png
					</code>{" "}
					and{" "}
					<code className="rounded bg-amber-100 px-1">
						/images/checa-logo.png
					</code>
					. Make sure to add these images to the{" "}
					<code className="rounded bg-amber-100 px-1">public/images/</code>{" "}
					directory for proper rendering.
				</p>
			</div>
		</div>
	);
}
