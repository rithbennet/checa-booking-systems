import { NextResponse } from "next/server";
import * as bookingService from "@/entities/booking/server/booking.service";
import {
  createProtectedHandler,
  serverError,
  unauthorized,
} from "@/shared/lib/api-factory";
import { rateLimit } from "@/shared/server/api-middleware";

/** POST /api/bookings — create a new draft booking */
export const POST = createProtectedHandler(async (request: Request, user) => {
  try {
    // Rate limiting: 10 draft creations per minute
    const rateLimitResponse = await rateLimit(request, 10, 60_000);
    if (rateLimitResponse) return rateLimitResponse;

    const result = await bookingService.createDraft({ userId: user.id });

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
});
