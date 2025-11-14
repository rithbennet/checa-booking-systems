import { type NextRequest, NextResponse } from "next/server";
import * as bookingService from "@/entities/booking/server/booking.service";
import { rateLimit } from "@/shared/server/api-middleware";
import {
  badRequest,
  forbidden,
  requireAuth,
  serverError,
  unauthorized,
} from "@/shared/server/policies";

/**
 * POST /api/bookings/[id]/submit
 * Submit booking for approval (owner only, draft status only)
 */
export async function POST(request: NextRequest) {
  try {
    // Parse bookingId from URL
    const url = new URL(request.url);
    const pathSegments = url.pathname.split("/");
    // URL is like /api/bookings/[id]/submit, so id is at index -2
    const bookingId = pathSegments[pathSegments.length - 2];

    if (!bookingId) {
      return badRequest("Booking ID is required");
    }

    // Rate limiting: 5 submissions per minute
    const rateLimitResponse = await rateLimit(request, 5, 60_000);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const user = await requireAuth();

    const result = await bookingService.submit({
      userId: user.userId,
      bookingId,
      userStatus: user.userStatus ?? "pending",
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") return unauthorized();
      if (error.message.includes("Forbidden")) return forbidden();
      if (
        error.message.includes("not submittable") ||
        error.message.includes("validation failed")
      ) {
        return badRequest(error.message);
      }
    }
    console.error("Error submitting booking:", error);
    return serverError(
      error instanceof Error ? error.message : "Failed to submit booking"
    );
  }
}
