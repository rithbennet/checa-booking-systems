// src/shared/server/auth/index.ts
import { getSession } from "./better-auth/server";

export async function auth() {
	const session = await getSession();
	if (!session) return null;

	const su = session.user as {
		appUserId?: string | null;
		role?: string | null;
		status?: string | null;
	};

	return {
		user: {
			...session.user,
			appUserId: su.appUserId ?? null,
			role: su.role ?? null,
			status: su.status ?? null,
		},
		expires: session.session.expiresAt.toISOString(),
	};
}
