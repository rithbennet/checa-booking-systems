import { adminReturnForEditDto } from "@/entities/booking/server/booking.dto";
import * as bookingService from "@/entities/booking/server/booking.service";
import {
  badRequest,
  createProtectedHandler,
  forbidden,
  serverError,
} from "@/shared/lib/api-factory";

/**
 * POST /api/admin/bookings/[id]/return-for-edit
 * Admin: Return booking for edit — protected by createProtectedHandler + role check
 */
export const POST = createProtectedHandler(
  async (request: Request, user, { params }) => {
    try {
      if (user.role !== "lab_administrator") return forbidden();

      const body = await request.json();

      // Validate input
      const validationResult = adminReturnForEditDto.safeParse(body);
      if (!validationResult.success) {
        return badRequest(
          `Validation error: ${validationResult.error.errors
            .map((e) => e.message)
            .join(", ")}`
        );
      }

      const bookingId = params?.id;
      if (!bookingId) return badRequest("Booking ID is required");

      await bookingService.adminReturnForEdit({
        adminId: user.id,
        bookingId,
        note: validationResult.data.note,
      });

      return { success: true };
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "Unauthorized") return { error: "Unauthorized" };
        if (error.message.includes("Forbidden")) return forbidden();
        if (
          error.message.includes("Cannot return") ||
          error.message.includes("Can only return")
        )
          return badRequest(error.message);
      }
      console.error("Error returning booking for edit:", error);
      return serverError(
        error instanceof Error
          ? error.message
          : "Failed to return booking for edit"
      );
    }
  }
);
