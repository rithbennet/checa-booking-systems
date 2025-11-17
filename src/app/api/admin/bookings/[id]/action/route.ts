import { doAdminAction } from "@/entities/booking/review/server/actions";
import { AdminActionSchema } from "@/entities/booking/review/server/validations";
import {
  createProtectedHandler,
  forbidden,
  serverError,
} from "@/shared/lib/api-factory";

export const POST = createProtectedHandler(
  async (
    request: Request,
    user,
    { params }: { params?: Record<string, string> }
  ) => {
    try {
      if (user.role !== "lab_administrator") return forbidden();
      const id = params?.id as string;
      const body = await request.json();

      const validated = AdminActionSchema.parse(body);

      const result = await doAdminAction({
        bookingId: id,
        adminUserId: user.id,
        action: validated.action,
        comment: validated.comment,
      });

      return result;
    } catch (error) {
      console.error("[admin/bookings/[id]/action POST]", error);
      return serverError(
        error instanceof Error ? error.message : "Internal server error"
      );
    }
  }
);
