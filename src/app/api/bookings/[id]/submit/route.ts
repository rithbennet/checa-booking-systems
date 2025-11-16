import { NextResponse } from "next/server";
import * as bookingService from "@/entities/booking/server/booking.service";
import {
  badRequest,
  createProtectedHandler,
  forbidden,
  serverError,
  unauthorized,
} from "@/shared/lib/api-factory";
import { rateLimit } from "@/shared/server/api-middleware";

/** POST /api/bookings/[id]/submit — submit booking for approval (owner only) */
export const POST = createProtectedHandler(
  async (request: Request, user, { params }) => {
    try {
      const bookingId = params?.id;
      if (!bookingId) return badRequest("Booking ID is required");

      // Rate limiting: 5 submissions per minute
      const rateLimitResponse = await rateLimit(request, 5, 60_000);
      if (rateLimitResponse) return rateLimitResponse;

      const userStatus =
        (user.status as
          | "active"
          | "pending"
          | "inactive"
          | "rejected"
          | "suspended") ?? "pending";
      const result = await bookingService.submit({
        userId: user.id,
        bookingId,
        userStatus,
      });

      return result;
    } catch (error) {
      if (error instanceof bookingService.BookingValidationError) {
        console.error("Booking validation failed:", error.issues);
        return NextResponse.json(
          {
            error: "Booking validation failed",
            issues: error.issues,
          },
          { status: 400 }
        );
      }

      if (error instanceof Error) {
        if (error.message === "Unauthorized") return unauthorized();
        if (error.message.includes("Forbidden")) return forbidden();
        if (
          error.message.includes("not submittable") ||
          error.message.includes("validation failed")
        )
          return badRequest(error.message);
      }
      console.error("Error submitting booking:", error);
      return serverError(
        error instanceof Error ? error.message : "Failed to submit booking"
      );
    }
  }
);
