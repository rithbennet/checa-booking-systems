import { NextResponse } from "next/server";
import * as bookingRepo from "@/entities/booking/server/booking.repo";
import * as bookingService from "@/entities/booking/server/booking.service";
import {
  badRequest,
  createProtectedHandler,
  serverError,
  unauthorized,
} from "@/shared/lib/api-factory";
import { rateLimit } from "@/shared/server/api-middleware";

/** POST /api/bookings — create a new draft booking */
export const POST = createProtectedHandler(async (request: Request, user) => {
  try {
    // Rate limiting: 10 draft creations per minute
    const rateLimitResponse = await rateLimit(request, 10, 60_000);
    if (rateLimitResponse) return rateLimitResponse;

    const result = await bookingService.createDraft({ userId: user.id });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorized();
    }
    console.error("Error creating draft booking:", error);
    return serverError(
      error instanceof Error ? error.message : "Failed to create booking"
    );
  }
});

/** GET /api/bookings — list current user's bookings with filters and pagination */
export const GET = createProtectedHandler(async (request: Request, user) => {
  try {
    const { searchParams } = new URL(request.url);

    // Parse pagination
    const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
    const pageSize = Math.min(
      Math.max(parseInt(searchParams.get("pageSize") || "25", 10), 1),
      100
    );

    // Parse filters
    const q = searchParams.get("q") || undefined;
    const sort = (searchParams.get("sort") || "updated_at:desc") as
      | "updated_at:desc"
      | "updated_at:asc"
      | "created_at:desc"
      | "created_at:asc"
      | "status:asc"
      | "amount:desc"
      | "amount:asc";

    const status = searchParams.getAll("status");
    const createdFrom = searchParams.get("createdFrom") || undefined;
    const createdTo = searchParams.get("createdTo") || undefined;
    const type = (searchParams.get("type") || "all") as
      | "all"
      | "analysis_only"
      | "working_space";

    const dateFrom = createdFrom ? new Date(createdFrom) : undefined;
    const dateTo = createdTo ? new Date(createdTo) : undefined;
    if (createdFrom && Number.isNaN(dateFrom?.getTime())) {
      return badRequest("Invalid createdFrom date");
    }
    if (createdTo && Number.isNaN(dateTo?.getTime())) {
      return badRequest("Invalid createdTo date");
    }

    const { items, total } = await bookingRepo.listUserBookings({
      userId: user.id,
      page,
      pageSize,
      q,
      sort,
      status: status.length > 0 ? status : undefined,
      createdFrom: dateFrom,
      createdTo: dateTo,
      type,
    });

    return NextResponse.json({ items, total });
  } catch (error) {
    console.error("Error listing bookings:", error);
    return serverError(
      error instanceof Error ? error.message : "Failed to list bookings"
    );
  }
});
