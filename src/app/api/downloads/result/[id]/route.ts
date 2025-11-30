import { createReadStream, existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { Readable } from "node:stream";
import { NextResponse } from "next/server";
import { getAnalysisResultWithPaymentCheck } from "@/entities/sample-tracking/server/user-results-repository";
import {
	createProtectedHandler,
	forbidden,
	notFound,
} from "@/shared/lib/api-factory";

/**
 * GET /api/downloads/result/[id]
 * Secure download endpoint for analysis results
 *
 * Security gate:
 * 1. Verify user session
 * 2. Verify user owns the booking
 * 3. Verify payment is verified (403 if not)
 * 4. Stream the file with Content-Disposition: attachment
 */
export const GET = createProtectedHandler(
	async (_req, user, { params }) => {
		const id = params?.id;

		if (!id) {
			return notFound("Result ID is required");
		}

		// Fetch result with ownership and payment verification
		const data = await getAnalysisResultWithPaymentCheck(id, user.id);

		if (!data) {
			return notFound("Result not found");
		}

		// Payment gate check
		if (!data.isPaid) {
			return forbidden(
				"Payment Required: Please verify payment in the Financials tab to unlock this result.",
			);
		}

		const { result } = data;

		// Construct file path (assuming files are stored in public/uploads or similar)
		const filePath = join(process.cwd(), "public", result.filePath);

		// Check if file exists
		if (!existsSync(filePath)) {
			console.error(`File not found at path: ${filePath}`);
			return notFound("Result file not found on server");
		}

		// Get file stats for Content-Length
		const stats = statSync(filePath);
		const fileSize = stats.size;

		// Create read stream
		const fileStream = createReadStream(filePath);

		// Convert Node.js stream to Web ReadableStream
		const webStream = Readable.toWeb(fileStream) as ReadableStream;

		// Determine content type
		const contentType = getContentType(result.fileType);

		// Return streaming response with attachment disposition
		return new NextResponse(webStream, {
			status: 200,
			headers: {
				"Content-Type": contentType,
				"Content-Disposition": `attachment; filename="${encodeURIComponent(result.fileName)}"`,
				"Content-Length": fileSize.toString(),
				"Cache-Control": "private, no-cache, no-store, must-revalidate",
				"X-Content-Type-Options": "nosniff",
			},
		});
	},
	{ requireActive: true },
);

/**
 * Map file type to MIME content type
 */
function getContentType(fileType: string): string {
	const typeMap: Record<string, string> = {
		"application/pdf": "application/pdf",
		pdf: "application/pdf",
		"application/vnd.ms-excel": "application/vnd.ms-excel",
		"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
			"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		xls: "application/vnd.ms-excel",
		xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		csv: "text/csv",
		"text/csv": "text/csv",
		"application/zip": "application/zip",
		zip: "application/zip",
		"image/png": "image/png",
		png: "image/png",
		"image/jpeg": "image/jpeg",
		jpeg: "image/jpeg",
		jpg: "image/jpeg",
	};

	return typeMap[fileType.toLowerCase()] || "application/octet-stream";
}
