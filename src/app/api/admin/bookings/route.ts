import { mapToBookingListItemVM } from "@/entities/booking/model/mappers";
import { repoAdminList } from "@/entities/booking/review/server/repository";
import {
  createProtectedHandler,
  forbidden,
  serverError,
} from "@/shared/lib/api-factory";

export const GET = createProtectedHandler(async (request: Request, user) => {
  try {
    if (user.role !== "lab_administrator") return forbidden();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status")?.split(",").filter(Boolean);
    const query = searchParams.get("query") ?? undefined;
    const page = Number.parseInt(searchParams.get("page") ?? "1");
    const pageSize = Number.parseInt(searchParams.get("pageSize") ?? "25");
    const sortField = searchParams.get("sortField") ?? "updatedAt";
    const sortDirection = (searchParams.get("sortDirection") ?? "desc") as
      | "asc"
      | "desc";

    const result = await repoAdminList({
      status,
      query,
      page,
      pageSize,
      sortField,
      sortDirection,
    });

    const items = result.items.map(mapToBookingListItemVM);

    return {
      items,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      totalPages: Math.ceil(result.total / result.pageSize),
    };
  } catch (error) {
    console.error("[admin/bookings GET]", error);
    return serverError(
      error instanceof Error ? error.message : "Internal server error"
    );
  }
});
