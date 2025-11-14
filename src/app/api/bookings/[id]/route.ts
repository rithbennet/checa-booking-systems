import { type NextRequest, NextResponse } from "next/server";
import { bookingSaveDraftDto } from "@/entities/booking/server/booking.dto";
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
 * GET /api/bookings/[id]
 * Get booking details (owner only)
 */
export async function GET(request: NextRequest) {
  try {
    // Parse bookingId from URL
    const url = new URL(request.url);
    const pathSegments = url.pathname.split("/");
    const bookingId = pathSegments[pathSegments.length - 1];

    if (!bookingId) {
      return badRequest("Booking ID is required");
    }

    const user = await requireAuth();

    const booking = await bookingService.getBooking({
      userId: user.userId,
      bookingId,
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    return NextResponse.json(booking);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") return unauthorized();
      if (error.message.includes("Forbidden")) return forbidden();
    }
    console.error("Error fetching booking:", error);
    return serverError(
      error instanceof Error ? error.message : "Failed to fetch booking"
    );
  }
}

/**
 * PATCH /api/bookings/[id]
 * Save draft booking (owner only, draft status only)
 */
export async function PATCH(request: NextRequest) {
  try {
    // Parse bookingId from URL
    const url = new URL(request.url);
    const pathSegments = url.pathname.split("/");
    const bookingId = pathSegments[pathSegments.length - 1];

    if (!bookingId) {
      return badRequest("Booking ID is required");
    }

    // Rate limiting: 30 requests per minute for draft saves
    const rateLimitResponse = await rateLimit(request, 30, 60_000);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const user = await requireAuth();
    const body = await request.json();

    // Validate input
    const validationResult = bookingSaveDraftDto.safeParse(body);
    if (!validationResult.success) {
      return badRequest(
        `Validation error: ${validationResult.error.errors
          .map((e) => e.message)
          .join(", ")}`
      );
    }

    const booking = await bookingService.saveDraft({
      userId: user.userId,
      bookingId,
      dto: validationResult.data,
      userType: user.userType,
    });

    return NextResponse.json(booking);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") return unauthorized();
      if (error.message.includes("Forbidden")) return forbidden();
      if (error.message.includes("not editable"))
        return badRequest(error.message);
    }
    console.error("Error saving draft:", error);
    return serverError(
      error instanceof Error ? error.message : "Failed to save draft"
    );
  }
}

/**
 * DELETE /api/bookings/[id]
 * Delete draft booking (owner only, draft status only)
 */
export async function DELETE(request: NextRequest) {
  try {
    // Parse bookingId from URL
    const url = new URL(request.url);
    const pathSegments = url.pathname.split("/");
    const bookingId = pathSegments[pathSegments.length - 1];

    if (!bookingId) {
      return badRequest("Booking ID is required");
    }

    const user = await requireAuth();

    await bookingService.deleteDraft({
      userId: user.userId,
      bookingId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") return unauthorized();
      if (error.message.includes("Forbidden")) return forbidden();
      if (error.message.includes("Can only delete"))
        return badRequest(error.message);
    }
    console.error("Error deleting draft:", error);
    return serverError(
      error instanceof Error ? error.message : "Failed to delete draft"
    );
  }
}
