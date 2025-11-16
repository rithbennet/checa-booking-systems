import * as bookingService from "@/entities/booking/server/booking.service";
import {
  badRequest,
  createProtectedHandler,
  forbidden,
  serverError,
} from "@/shared/lib/api-factory";

/**
 * POST /api/admin/bookings/[id]/approve
 * Admin: Approve booking — protected by createProtectedHandler + role check
 */
export const POST = createProtectedHandler(
  async (_request: Request, user, { params }) => {
    try {
      if (user.role !== "lab_administrator") return forbidden();

      const bookingId = params?.id;
      if (!bookingId) return badRequest("Booking ID is required");

      await bookingService.adminApprove({ adminId: user.id, bookingId });

      return { success: true };
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "Unauthorized") return { error: "Unauthorized" };
        if (error.message.includes("Forbidden")) return forbidden();
        if (error.message.includes("Can only approve"))
          return badRequest(error.message);
      }
      console.error("Error approving booking:", error);
      return serverError(
        error instanceof Error ? error.message : "Failed to approve booking"
      );
    }
  }
);
