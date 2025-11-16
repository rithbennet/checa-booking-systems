import { type NextRequest, NextResponse } from "next/server";
import * as bookingService from "@/entities/booking/server/booking.service";
import { serverError, unauthorized } from "@/shared/lib/api-factory";

/** POST /api/admin/jobs/cleanup-drafts — delete draft bookings older than 7 days */
export async function POST(request: NextRequest) {
  try {
    // Verify cron job authorization
    const key = request.headers.get("x-admin-job-key");
    const expectedKey = process.env.JOB_KEY;

    if (expectedKey && key !== expectedKey) {
      return unauthorized("Invalid job key");
    }

    // Calculate cutoff date (7 days ago)
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Purge expired drafts
    const purged = await bookingService.purgeExpiredDrafts(cutoff);

    return NextResponse.json({
      success: true,
      purged,
      cutoff: cutoff.toISOString(),
    });
  } catch (error) {
    console.error("Error cleaning up drafts:", error);
    return serverError(
      error instanceof Error ? error.message : "Failed to cleanup drafts"
    );
  }
}
