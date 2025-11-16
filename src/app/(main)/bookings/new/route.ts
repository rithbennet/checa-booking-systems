import { NextResponse } from "next/server";
import * as bookingService from "@/entities/booking/server/booking.service";
import { requireCurrentUserApi } from "@/shared/server/current-user";

/**
 * Create a draft booking and redirect to its edit page.
 * Supports optional ?serviceId= to pre-select a service.
 */
export async function GET(request: Request) {
  try {
    const me = await requireCurrentUserApi();

    // Optional ?serviceId= query param
    const url = new URL(request.url);
    const serviceId = url.searchParams.get("serviceId") ?? undefined;

    // Create draft booking (forward serviceId when present)
    const result = await bookingService.createDraft({
      userId: me.appUserId,
      ...(serviceId ? { serviceId } : {}),
    });

    // Build absolute URL for redirect using normalized base
    const absoluteUrl = new URL(
      `/bookings/${result.bookingId}/edit`,
      getBaseUrl()
    );

    return NextResponse.redirect(absoluteUrl);
  } catch (error) {
    // Log and let middleware / global handlers deal with auth errors
    console.error("Error creating draft booking:", error);

    // If it's an auth error, rethrow so middleware can redirect.
    const errWithStatus = error as { status?: number };
    if (errWithStatus.status === 401) {
      throw error;
    }

    // For other errors, return a 500 JSON response. Avoid doing
    // client redirects here because middleware already handles auth flows.
    return NextResponse.json(
      { error: "Failed to create draft booking" },
      { status: 500 }
    );
  }
}

function getBaseUrl() {
  const envUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.VERCEL_URL ||
    "http://localhost:3000";
  return envUrl.startsWith("http") ? envUrl : `https://${envUrl}`;
}
