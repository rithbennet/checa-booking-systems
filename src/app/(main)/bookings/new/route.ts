import { NextResponse } from "next/server";
import * as bookingService from "@/entities/booking/server/booking.service";
import { requireCurrentUserApi } from "@/shared/server/current-user";

/**
 * GET /bookings/new
 * Creates a draft booking immediately and redirects to the edit page
 * This ensures instant draft creation for the Option C flow
 * Supports ?serviceId= query param to pre-select a service
 */
export async function GET() {
  try {
    const me = await requireCurrentUserApi();

    // Create draft booking
    const result = await bookingService.createDraft({
      userId: me.appUserId,
    });

    // Build absolute URL for redirect
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.VERCEL_URL ||
      "http://localhost:3000";
    const absoluteUrl = new URL(
      `/bookings/${result.bookingId}/edit`,
      baseUrl.startsWith("http") ? baseUrl : `https://${baseUrl}`
    );

    return NextResponse.redirect(absoluteUrl);
  } catch (error) {
    console.error("Error creating draft booking:", error);

    // Handle auth errors
    if (error instanceof Error && "status" in error && error.status === 401) {
      const signInUrl = new URL(
        "/signIn",
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      );
      return NextResponse.redirect(signInUrl);
    }

    // For other errors, redirect to bookings list with error
    const bookingsUrl = new URL(
      "/bookings",
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    );
    return NextResponse.redirect(bookingsUrl);
  }
}
