import * as bookingRepo from "@/entities/booking/server/booking.repo";
import { createProtectedHandler, serverError } from "@/shared/lib/api-factory";

/** GET /api/bookings/status-counts — counts per status for current user's bookings */
export const GET = createProtectedHandler(async (request: Request, user) => {
  try {
    const { searchParams } = new URL(request.url);

    const status = searchParams.getAll("status");
    const createdFrom = searchParams.get("createdFrom") || undefined;
    const createdTo = searchParams.get("createdTo") || undefined;
    const type = (searchParams.get("type") || "all") as
      | "all"
      | "analysis_only"
      | "working_space";

    const dateFrom = createdFrom ? new Date(createdFrom) : undefined;
    const dateTo = createdTo ? new Date(createdTo) : undefined;

    const counts = await bookingRepo.countUserBookingsByStatus({
      userId: user.id,
      status: status.length > 0 ? status : undefined,
      createdFrom: dateFrom,
      createdTo: dateTo,
      type,
    });

    return counts;
  } catch (error) {
    console.error("Error computing bookings status counts:", error);
    return serverError(
      error instanceof Error ? error.message : "Failed to get counts"
    );
  }
});
