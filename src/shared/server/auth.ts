/**
 * Auth helper for app usage
 * Provides a simple auth() function for server-side usage
 */

import { getSession } from "./better-auth/server";
import { db } from "./db";

/**
 * Get the current session with user role from User model
 * Compatible with NextAuth-style usage
 */
export async function auth() {
  const session = await getSession();
  if (!session) {
    return null;
  }

  // Fetch user from our User model to get role/userType
  // Note: User might not exist yet if they just registered via Better Auth
  let userRole: string | null = null;
  let userStatus: string | null = null;

  try {
    const user = await db.user.findUnique({
      where: { email: session.user.email },
      select: {
        userType: true,
        status: true,
      },
    });

    if (user) {
      userRole =
        user.userType === "lab_administrator"
          ? "lab_administrator"
          : user.userType;
      userStatus = user.status;
    }
  } catch {
    // User table might not exist yet or schema not migrated
    // Continue without role/status
  }

  // Transform better-auth session to NextAuth-like format
  return {
    user: {
      ...session.user,
      role: userRole,
      status: userStatus,
    },
    expires: session.session.expiresAt.toISOString(),
  };
}
