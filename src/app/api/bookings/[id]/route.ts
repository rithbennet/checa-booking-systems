import { NextResponse } from "next/server";
import { bookingSaveDraftDto } from "@/entities/booking/server/booking.dto";
import * as bookingService from "@/entities/booking/server/booking.service";
import {
  badRequest,
  createProtectedHandler,
  forbidden,
  serverError,
} from "@/shared/lib/api-factory";
import { rateLimit } from "@/shared/server/api-middleware";

/** GET /api/bookings/[id] — booking details (owner only) */
export const GET = createProtectedHandler(
  async (_request: Request, user, { params }) => {
    try {
      const bookingId = params?.id;

      if (!bookingId) return badRequest("Booking ID is required");

      const booking = await bookingService.getBooking({
        userId: user.id,
        bookingId,
      });

      if (!booking)
        return NextResponse.json(
          { error: "Booking not found" },
          { status: 404 }
        );

      return booking;
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("Forbidden")) return forbidden();
      }
      console.error("Error fetching booking:", error);
      return serverError(
        error instanceof Error ? error.message : "Failed to fetch booking"
      );
    }
  }
);

/** PATCH /api/bookings/[id] — save draft booking (owner only) */
export const PATCH = createProtectedHandler(
  async (request: Request, user, { params }) => {
    try {
      const bookingId = params?.id;

      if (!bookingId) return badRequest("Booking ID is required");

      // Rate limiting: 30 requests per minute for draft saves
      const rateLimitResponse = await rateLimit(request, 30, 60_000);
      if (rateLimitResponse) return rateLimitResponse;

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
        userId: user.id,
        bookingId,
        dto: validationResult.data,
        userType: user.role ?? "",
      });

      return booking;
    } catch (error) {
      if (error instanceof Error) {
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
);

/** DELETE /api/bookings/[id] — delete draft booking (owner only) */
export const DELETE = createProtectedHandler(
  async (_request: Request, user, { params }) => {
    try {
      const bookingId = params?.id;

      if (!bookingId) return badRequest("Booking ID is required");

      await bookingService.deleteDraft({ userId: user.id, bookingId });

      return NextResponse.json({ success: true });
    } catch (error) {
      if (error instanceof Error) {
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
);
