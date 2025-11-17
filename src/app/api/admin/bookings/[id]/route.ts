import { mapToBookingDetailVM } from "@/entities/booking/model/mappers";
import { repoAdminDetail } from "@/entities/booking/review/server/repository";
import {
  badRequest,
  createProtectedHandler,
  forbidden,
  notFound,
  serverError,
} from "@/shared/lib/api-factory";
import { Prisma } from "generated/prisma";

export const GET = createProtectedHandler(
  async (
    _request: Request,
    user,
    { params }: { params?: Record<string, string> }
  ) => {
    try {
      if (user.role !== "lab_administrator") return forbidden();
      
      // Validate params.id
      if (!params?.id || typeof params.id !== "string" || params.id.trim() === "") {
        return badRequest("Invalid booking ID");
      }
      const id = params.id;

      const booking = await repoAdminDetail(id);
      const vm = mapToBookingDetailVM(booking);

      return vm;
    } catch (error) {
      console.error("[admin/bookings/[id] GET]", error);
      
      // Handle Prisma not found error (P2025 from findUniqueOrThrow)
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        return notFound();
      }
      
      return serverError("Internal server error");
    }
  }
);
