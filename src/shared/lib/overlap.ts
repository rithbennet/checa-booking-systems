/**
 * Date Block Overlap Utilities
 *
 * ⚠️ WARNING: This function is for DATE-ONLY (start-of-day) comparisons only.
 * It normalizes all dates to start-of-day, dropping time information.
 *
 * For booking conflict checks that need to preserve time information,
 * use the overlap logic in `src/entities/booking/server/booking.service.ts`
 * (see lines ~365) or `src/features/bookings/form/lib/workspace-utils.ts`
 * which use `doDateRangesOverlap` without normalization.
 *
 * This function is suitable only when you need to check if date blocks
 * (calendar days) overlap, ignoring time-of-day.
 */

/**
 * Check if two date blocks (date-only ranges) overlap
 * Overlap condition: aStart <= bEnd AND aEnd >= bStart
 *
 * ⚠️ NOTE: All dates are normalized to start-of-day (time is dropped).
 * Use this only for date-only comparisons, not for precise datetime ranges.
 */
export function dateBlocksOverlap(
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
