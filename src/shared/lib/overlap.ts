/**
 * Date Range Overlap Utilities
 * Used for conflict detection in workspace bookings
 */

/**
 * Check if two date ranges overlap
 * Overlap condition: aStart <= bEnd AND aEnd >= bStart
 */
export function dateRangesOverlap(
	aStart: Date,
	aEnd: Date,
	bStart: Date,
	bEnd: Date,
): boolean {
	// Normalize to start of day for date-only comparisons
	const normalize = (d: Date): Date => {
		const normalized = new Date(d);
		normalized.setHours(0, 0, 0, 0);
		return normalized;
	};

	const aStartNorm = normalize(aStart);
	const aEndNorm = normalize(aEnd);
	const bStartNorm = normalize(bStart);
	const bEndNorm = normalize(bEnd);

	return aStartNorm <= bEndNorm && aEndNorm >= bStartNorm;
}
