import { NextResponse } from "next/server";
import { getSession } from "@/shared/server/better-auth/server";
import { db } from "@/shared/server/db";

/**
 * Get linked accounts for the current user
 */
export async function GET() {
	try {
		const session = await getSession();
		if (!session?.user) {
			return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
		}

		const authUserId = session.user.id;
		if (!authUserId) {
			return NextResponse.json({ error: "Invalid session" }, { status: 400 });
		}

		// Get all linked accounts for this user
		const accounts = await db.betterAuthAccount.findMany({
			where: { userId: authUserId },
			select: {
				id: true,
				providerId: true,
				accountId: true,
				createdAt: true,
			},
		});

		// Format accounts for the UI
		const linkedAccounts = accounts.map((account) => ({
			id: account.id,
			provider: account.providerId,
			accountId: account.accountId,
			linkedAt: account.createdAt.toISOString(),
		}));

		return NextResponse.json({ accounts: linkedAccounts });
	} catch (error) {
		console.error("Error fetching linked accounts:", error);
		return NextResponse.json(
			{ error: "Failed to fetch linked accounts" },
			{ status: 500 },
		);
	}
}
