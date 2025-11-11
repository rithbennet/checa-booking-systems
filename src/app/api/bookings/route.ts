import { NextResponse } from "next/server";
import { createBooking } from "@/entities/booking/api/create-booking";
import { createBookingInputSchema } from "@/entities/booking/model/schemas";
import { badRequestResponse, withAuth } from "@/shared/server/api-middleware";

export const POST = withAuth(
	async (request, auth) => {
		try {
			const body = await request.json();

			// Validate input
			const validationResult = createBookingInputSchema.safeParse(body);
			if (!validationResult.success) {
				return badRequestResponse(
					`Validation error: ${validationResult.error.errors.map((e) => e.message).join(", ")}`,
				);
			}

			// Get user ID from session
			const userId = auth.user.id;

			// Create booking
			const result = await createBooking(validationResult.data, userId);

			return NextResponse.json(result, { status: 201 });
		} catch (error) {
			console.error("Error creating booking:", error);
			return NextResponse.json(
				{
					error: "Failed to create booking",
					message:
						error instanceof Error
							? error.message
							: "An unexpected error occurred",
				},
				{ status: 500 },
			);
		}
	},
	{
		requireActive: true,
		rateLimit: {
			maxRequests: 10,
			windowMs: 60000, // 1 minute
		},
	},
);
