import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { customSession } from "better-auth/plugins";
import NodeCache from "node-cache";

import { env } from "@/env";
import { db } from "@/shared/server/db";

// Create a tiny in-memory cache for session extensions
const userCache = new NodeCache({ stdTTL: 300 }); // 5 minutes

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
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // built-in cache, 5 min
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
      generateId: false, // use PG gen_random_uuid()
    },
  },
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },

  // ✅ Conditional social provider registration (prevents warnings)
  socialProviders: {
    ...(env.BETTER_AUTH_GOOGLE_CLIENT_ID &&
      env.BETTER_AUTH_GOOGLE_CLIENT_SECRET && {
        google: {
          clientId: env.BETTER_AUTH_GOOGLE_CLIENT_ID,
          clientSecret: env.BETTER_AUTH_GOOGLE_CLIENT_SECRET,
        },
      }),
  },

  plugins: [
    // ✅ Cache user details to avoid DB hits every request
    customSession(async ({ user, session }) => {
      const cacheKey = `user_session_${user.id}`;

      const cached = userCache.get(cacheKey);
      if (cached) {
        return { user: { ...user, ...cached }, session };
      }

      const appUser = await db.user.findUnique({
        where: { authUserId: user.id },
        select: { id: true, userType: true, status: true },
      });

      if (!appUser) {
        return { user, session };
      }

      const extra = {
        appUserId: appUser.id,
        role:
          appUser.userType === "lab_administrator"
            ? "lab_administrator"
            : appUser.userType,
        status: appUser.status,
      };

      // Cache to avoid repetitive lookups
      userCache.set(cacheKey, extra);

      console.log("[auth-session]", "hydrating from DB for user", user.id);

      return { user: { ...user, ...extra }, session, persist: true };
    }),

    // 🍪 Must always be last for proper cookie handling
    nextCookies(),
  ],
});

export type Session = typeof auth.$Infer.Session;
