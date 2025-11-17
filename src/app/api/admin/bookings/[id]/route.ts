import { mapToBookingDetailVM } from "@/entities/booking/model/mappers";
import { repoAdminDetail } from "@/entities/booking/review/server/repository";
import {
  createProtectedHandler,
  forbidden,
  serverError,
} from "@/shared/lib/api-factory";

export const GET = createProtectedHandler(
  async (
    _request: Request,
    user,
    { params }: { params?: Record<string, string> }
  ) => {
    try {
      if (user.role !== "lab_administrator") return forbidden();
      const id = params?.id as string;

      const booking = await repoAdminDetail(id);
      const vm = mapToBookingDetailVM(booking);

      return vm;
    } catch (error) {
      console.error("[admin/bookings/[id] GET]", error);
      return serverError(
        error instanceof Error ? error.message : "Internal server error"
      );
    }
  }
);
