import { NextResponse } from "next/server";
import { getAllOnboardingOptions } from "@/entities/user/server/onboarding-options-repository";

/**
 * GET /api/auth/registration-options
 * Returns all dropdown options for the registration form
 * Public endpoint - no authentication required
 */
export async function GET() {
	try {
		const options = await getAllOnboardingOptions();
		return NextResponse.json(options);
	} catch (error) {
		console.error("Error fetching registration options:", error);
		return NextResponse.json(
			{ error: "Failed to fetch registration options" },
			{ status: 500 },
		);
	}
}
