import { NextResponse } from "next/server";
import * as bookingService from "@/entities/booking/server/booking.service";
import { rateLimit } from "@/shared/server/api-middleware";
import {
  requireAuth,
  serverError,
  unauthorized,
} from "@/shared/server/policies";

/**
 * POST /api/bookings
 * Create a new draft booking
 */
export async function POST(request: Request) {
  try {
    // Rate limiting: 10 draft creations per minute
    const rateLimitResponse = await rateLimit(request, 10, 60_000);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const user = await requireAuth();

    const result = await bookingService.createDraft({
      userId: user.userId,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorized();
    }
    console.error("Error creating draft booking:", error);
    return serverError(
      error instanceof Error ? error.message : "Failed to create booking"
    );
  }
}
