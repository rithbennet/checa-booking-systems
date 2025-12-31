/**
 * usePrefetchFiles Hook
 *
 * Preloads file URLs in the background for faster display when user clicks download/preview.
 * Uses link prefetch hints and fetch API to warm up the cache.
 */

import { useEffect } from "react";

interface PrefetchableFile {
	url: string | null;
	type?: string;
}

/**
 * Prefetch a list of file URLs in the background.
 * This helps reduce loading time when user clicks to view/download files.
 *
 * @param files - Array of file objects with URL and optional type
 * @param enabled - Whether prefetching is enabled (default: true)
 */
export function usePrefetchFiles(
	files: PrefetchableFile[],
	enabled = true,
): void {
	useEffect(() => {
		if (!enabled || typeof window === "undefined") return;

		const validUrls = files.filter((f) => f.url).map((f) => f.url as string);

		if (validUrls.length === 0) return;

		// Use requestIdleCallback or setTimeout for non-blocking prefetch
		const prefetch = () => {
			for (const url of validUrls) {
				// Create a prefetch link hint
				const link = document.createElement("link");
				link.rel = "prefetch";
				link.href = url;
				link.as = "fetch";
				link.crossOrigin = "anonymous";

				// Check if this link already exists
				const existing = document.querySelector(`link[href="${url}"]`);
				if (!existing) {
					document.head.appendChild(link);
				}
			}
		};

		// Use requestIdleCallback if available for better performance
		if ("requestIdleCallback" in window) {
			const id = window.requestIdleCallback(prefetch, { timeout: 2000 });
			return () => window.cancelIdleCallback(id);
		}
		// Fallback to setTimeout
		const timeoutId = setTimeout(prefetch, 100);
		return () => clearTimeout(timeoutId);
	}, [files, enabled]);
}

/**
 * Extract all prefetchable file URLs from a booking detail object.
 * Includes service forms, working area agreements, and sample results.
 */
export function extractPrefetchableUrls(booking: {
	serviceForms: Array<{
		serviceFormUnsignedPdfPath: string | null;
		workingAreaAgreementUnsignedPdfPath: string | null;
	}>;
	serviceItems: Array<{
		sampleTracking: Array<{
			analysisResults: Array<{ filePath: string }>;
		}>;
	}>;
}): PrefetchableFile[] {
	const files: PrefetchableFile[] = [];

	// Service forms and working area agreements
	for (const form of booking.serviceForms) {
		if (form.serviceFormUnsignedPdfPath) {
			files.push({ url: form.serviceFormUnsignedPdfPath, type: "pdf" });
		}
		if (form.workingAreaAgreementUnsignedPdfPath) {
			files.push({
				url: form.workingAreaAgreementUnsignedPdfPath,
				type: "pdf",
			});
		}
	}

	// Sample results
	for (const item of booking.serviceItems) {
		for (const sample of item.sampleTracking) {
			for (const result of sample.analysisResults) {
				if (result.filePath) {
					files.push({ url: result.filePath });
				}
			}
		}
	}

	return files;
}
