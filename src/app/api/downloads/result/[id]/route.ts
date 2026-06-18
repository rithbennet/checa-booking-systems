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

		// Document verification gate check
		// Results are only available after all required documents are verified
		if (!data.isPaid) {
			const details = data.verificationDetails;
			let message = "Results Locked: ";

			if (details) {
				const missing: string[] = [];
				if (!details.serviceFormVerified) missing.push("signed service form");
				if (details.requiresWorkspaceForm && !details.workspaceFormVerified)
					missing.push("signed workspace form");
				if (!details.paymentReceiptVerified)
					missing.push("verified payment receipt");

				if (missing.length > 0) {
					message += `Please upload and get the following verified: ${missing.join(", ")}.`;
				} else {
					message +=
						"Please complete document verification to unlock your results.";
				}
			} else {
				message +=
					"Please complete document verification to unlock your results.";
			}

			return forbidden(message);
		}

		const { result } = data;

		if (isRemoteFilePath(result.filePath)) {
			const fileResponse = await fetch(result.filePath);

			if (!fileResponse.ok || !fileResponse.body) {
				console.error(
					`Remote result file not found: ${result.filePath} (${fileResponse.status})`,
				);
				return notFound("Result file not found on server");
			}

			const headers = new Headers({
				"Content-Type":
					fileResponse.headers.get("content-type") ??
					getContentType(result.fileType),
				"Content-Disposition": `attachment; filename="${encodeURIComponent(result.fileName)}"`,
				"Cache-Control": "private, no-cache, no-store, must-revalidate",
				"X-Content-Type-Options": "nosniff",
			});

			const contentLength = fileResponse.headers.get("content-length");
			if (contentLength) {
				headers.set("Content-Length", contentLength);
			}

			return new NextResponse(fileResponse.body, {
				status: 200,
				headers,
			});
		}

		// Construct file path for legacy local files.
		const filePath = join(process.cwd(), "public", result.filePath);

		if (!existsSync(filePath)) {
			console.error(`Local result file not found at path: ${filePath}`);
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

function isRemoteFilePath(filePath: string): boolean {
	try {
		const url = new URL(filePath);
		return url.protocol === "http:" || url.protocol === "https:";
	} catch {
		return false;
	}
}

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
