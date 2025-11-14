import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { customSession } from "better-auth/plugins";

import { env } from "@/env";
import { db } from "@/shared/server/db";

export const auth = betterAuth({
	database: prismaAdapter(db, {
		provider: "postgresql",
	}),
	baseURL: env.BETTER_AUTH_URL,
	secret: env.BETTER_AUTH_SECRET,
	user: {
		modelName: "BetterAuthUser",
	},
	session: {
		modelName: "BetterAuthSession",
		// Enable cookie cache to store session data (including custom fields) in cookies
		// This avoids database queries on every request
		cookieCache: {
			enabled: true,
			maxAge: 5 * 60, // 5 minutes - refresh cache every 5 minutes
		},
	},
	account: {
		modelName: "BetterAuthAccount",
	},
	verification: {
		modelName: "BetterAuthVerification",
	},
	advanced: {
		database: {
			// Disable ID generation - let PostgreSQL generate UUIDs via gen_random_uuid()
			generateId: false,
		},
	},
	emailAndPassword: {
		enabled: true,
		autoSignIn: true,
	},
	socialProviders: {
		google: {
			clientId: env.BETTER_AUTH_GOOGLE_CLIENT_ID ?? "",
			clientSecret: env.BETTER_AUTH_GOOGLE_CLIENT_SECRET ?? "",
		},
	},
	plugins: [
		// in betterAuth config plugins: customSession(...)
		customSession(async ({ user, session }) => {
			let appUserId: string | null = null;
			let userRole: string | null = null;
			let userStatus: string | null = null;

			try {
				const appUser = await db.user.findUnique({
					where: { email: user.email },
					select: { id: true, userType: true, status: true },
				});

				if (appUser) {
					appUserId = appUser.id;
					userRole =
						appUser.userType === "lab_administrator"
							? "lab_administrator"
							: appUser.userType;
					userStatus = appUser.status;
				}
			} catch {
				// optional: log
			}

			return {
				user: {
					...user,
					appUserId, // critical field
					role: userRole,
					status: userStatus,
				},
				session,
			};
		}),
		nextCookies(), // Must be last plugin - automatically sets cookies in server actions
	],
});

export type Session = typeof auth.$Infer.Session;
