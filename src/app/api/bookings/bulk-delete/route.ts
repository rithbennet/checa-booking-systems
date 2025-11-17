import { NextResponse } from "next/server";
import * as bookingService from "@/entities/booking/server/booking.service";
import {
  badRequest,
  createProtectedHandler,
  serverError,
} from "@/shared/lib/api-factory";
import { rateLimit } from "@/shared/server/api-middleware";

/** POST /api/bookings/bulk-delete — delete multiple draft bookings (owner only) */
export const POST = createProtectedHandler(async (request: Request, user) => {
  try {
    // Rate limiting: 5 bulk deletes per minute
    const rateLimitResponse = await rateLimit(request, 5, 60_000);
    if (rateLimitResponse) return rateLimitResponse;

    const body = await request.json();
    const { bookingIds } = body as { bookingIds: string[] };

    if (!Array.isArray(bookingIds) || bookingIds.length === 0) {
      return badRequest("bookingIds must be a non-empty array");
    }

    if (bookingIds.length > 50) {
      return badRequest("Cannot delete more than 50 bookings at once");
    }

    // Delete each booking (will check ownership and draft status)
    const results = await Promise.allSettled(
      bookingIds.map((id) =>
        bookingService.deleteDraft({
          userId: user.id,
          bookingId: id,
        })
      )
    );

    const successful = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    return NextResponse.json({
      success: true,
      deleted: successful,
      failed,
      total: bookingIds.length,
    });
  } catch (error) {
    console.error("Error bulk deleting bookings:", error);
    return serverError(
      error instanceof Error ? error.message : "Failed to delete bookings"
    );
  }
});
