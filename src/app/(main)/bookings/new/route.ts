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

		// Use same-origin redirect. This keeps you on the current deployment domain.
		const redirectPath = `/bookings/${result.bookingId}/edit`;
		const sameOriginUrl = new URL(redirectPath, url); // url preserves current origin

		return NextResponse.redirect(sameOriginUrl);
	} catch (error) {
		console.error("Error creating draft booking:", error);

		// Let auth middleware handle unauthorized
		const errWithStatus = error as { status?: number };
		if (errWithStatus.status === 401) {
			throw error;
		}

		return NextResponse.json(
			{ error: "Failed to create draft booking" },
			{ status: 500 },
		);
	}
}
