import { NextResponse } from "next/server";
import { getAllOnboardingOptions } from "@/entities/user/server/onboarding-options-repository";
import { getSession } from "@/shared/server/better-auth/server";

/**
 * GET /api/auth/onboarding-options
 * Returns all dropdown options for the onboarding form
 * Requires a valid session (user is authenticated via Better Auth)
 */
export async function GET() {
	try {
		// Check for valid session
		const session = await getSession();
		if (!session?.user) {
			return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
		}

		const options = await getAllOnboardingOptions();
		return NextResponse.json(options);
	} catch (error) {
		console.error("Error fetching onboarding options:", error);
		return NextResponse.json(
			{ error: "Failed to fetch onboarding options" },
			{ status: 500 },
		);
	}
}
