import {
  createProtectedHandler,
  forbidden,
  serverError,
} from "@/shared/lib/api-factory";
import { db } from "@/shared/server/db";

export const GET = createProtectedHandler(async (_request: Request, user) => {
  try {
    if (user.role !== "lab_administrator") return forbidden();

    // Get counts for each status (excluding draft)
    const [
      all,
      pendingApproval,
      revisionSubmitted,
      revisionRequested,
      approved,
      inProgress,
      completed,
      rejected,
      cancelled,
    ] = await Promise.all([
      db.bookingRequest.count({
        where: { status: { not: "draft" } },
      }),
      db.bookingRequest.count({
        where: { status: "pending_approval" },
      }),
      db.bookingRequest.count({
        where: { status: "revision_submitted" },
      }),
      db.bookingRequest.count({
        where: { status: "revision_requested" },
      }),
      db.bookingRequest.count({
        where: { status: "approved" },
      }),
      db.bookingRequest.count({
        where: { status: "in_progress" },
      }),
      db.bookingRequest.count({
        where: { status: "completed" },
      }),
      db.bookingRequest.count({
        where: { status: "rejected" },
      }),
      db.bookingRequest.count({
        where: { status: "cancelled" },
      }),
    ]);

    return {
      all,
      pending_approval: pendingApproval,
      revision_submitted: revisionSubmitted,
      revision_requested: revisionRequested,
      approved,
      in_progress: inProgress,
      completed,
      rejected,
      cancelled,
    };
  } catch (error) {
    console.error("[admin/bookings/counts GET]", error);
    return serverError(
      error instanceof Error ? error.message : "Internal server error"
    );
  }
});
