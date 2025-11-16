import { NextResponse } from "next/server";
// Use the project's auth wrapper which normalizes the Better Auth session shape.
// `src/shared/server/auth.ts` exports `auth()` which returns { user, expires } or null.
import { auth } from "@/shared/server/auth";

type User = { id: string; role?: string | null; status?: string | null };
type HandlerCtx = { params?: Record<string, string> };

type ProtectedHandlerFn = (
  req: Request,
  user: User,
  ctx: HandlerCtx
) => Promise<Response | unknown> | Response | unknown;

export function createProtectedHandler(
  fn: ProtectedHandlerFn,
  opts?: { requireActive?: boolean }
) {
  // Return a route-compatible handler: (req, ctx?) => Response | Promise<Response>
  return async (req: Request, ctx?: HandlerCtx) => {
    try {
      // Use the repository `auth()` helper which returns the normalized shape.
      const session = await auth();

      if (!session || !session.user || !session.user.appUserId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      if (opts?.requireActive && session.user.status !== "active") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const user: User = {
        id: session.user.appUserId,
        role: session.user.role,
        status: session.user.status,
      };

      let resolvedParams: Record<string, string> | undefined;
      if (ctx && "params" in ctx) {
        const maybeParams = (ctx as unknown as { params?: unknown }).params;

        const isThenable = (value: unknown): value is Promise<unknown> => {
          return (
            !!value && typeof (value as { then?: unknown }).then === "function"
          );
        };

        if (maybeParams !== undefined) {
          if (isThenable(maybeParams)) {
            resolvedParams = (await maybeParams) as
              | Record<string, string>
              | undefined;
          } else {
            resolvedParams = maybeParams as Record<string, string> | undefined;
          }
        }
      }

      const handlerCtx: HandlerCtx = { params: resolvedParams ?? undefined };

      const result = await fn(req, user, handlerCtx);

      // If handler returned a Response, pass it through
      if (result instanceof Response) return result;

      // Otherwise, return JSON
      return NextResponse.json(result);
    } catch (err: unknown) {
      // Log for observability and return a generic 500
      console.error("createProtectedHandler error:", err);
      return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 }
      );
    }
  };
}

/* -------------------------------------------------------------------------- */
/* Policies (moved here for consolidation)                                     */
/* -------------------------------------------------------------------------- */
/**
 * Get current authenticated user session
 * Throws 401 if not authenticated or appUserId is missing
 */
export async function requireAuth() {
  const session = await auth();

  if (!session?.user?.appUserId) {
    const err = new Error("Unauthorized") as Error & { status?: number };
    err.status = 401;
    throw err;
  }

  return {
    userId: session.user.appUserId, // This is the app User.id (FK-safe)
    userEmail: session.user.email,
    userType: session.user.role ?? "",
    userStatus: session.user.status as
      | "active"
      | "pending"
      | "inactive"
      | "rejected"
      | "suspended"
      | null,
    authUserId: session.user.id,
  };
}

/**
 * Require admin role
 * Throws 403 if not admin
 */
export async function requireAdmin() {
  const user = await requireAuth();

  if (user.userType !== "lab_administrator") {
    throw new Error("Forbidden: Admin access required");
  }

  return {
    adminId: user.userId, // app User.id
    userEmail: user.userEmail,
  };
}

/** Error response helpers for API routes */
export function unauthorized(message = "Unauthorized") {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function forbidden(message = "Forbidden") {
  return NextResponse.json({ error: message }, { status: 403 });
}

export function badRequest(message = "Bad request") {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function notFound(message = "Not found") {
  return NextResponse.json({ error: message }, { status: 404 });
}

export function serverError(message = "Internal server error") {
  return NextResponse.json({ error: message }, { status: 500 });
}

/*
Usage examples (App Router - app/api/.../route.ts)

1) User-owned GET by ID

// app/api/items/[id]/route.ts
import { createProtectedHandler } from "@/shared/lib/api-factory";
import { db } from "@/shared/server/db"; // your prisma/db

export const GET = createProtectedHandler(async (req, user, { params }) => {
  const id = params?.id!;

  const item = await db.item.findFirst({ where: { id, userId: user.id } });
  if (!item) return NextResponse.json({ error: "Not Found" }, { status: 404 });
  return item;
});

2) User-owned DELETE

// app/api/items/[id]/route.ts
export const DELETE = createProtectedHandler(async (req, user, { params }) => {
  const id = params?.id!;
  const res = await db.item.deleteMany({ where: { id, userId: user.id } });
  if (res.count === 0) return NextResponse.json({ error: "Not Found" }, { status: 404 });
  return NextResponse.json({ success: true });
});

3) Admin-only DELETE

export const DELETE_ADMIN = createProtectedHandler(async (req, user, { params }) => {
  if (user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const id = params?.id!;
  await db.item.deleteMany({ where: { id } });
  return NextResponse.json({ success: true });
});

Notes:
- This factory focuses on authentication/activation checks and consistent JSON/Response handling.
- CSRF and global security headers are expected to be handled in `middleware.ts` (Option B).
- Ownership and business-logic checks should be enforced in the route handler via DB queries (see examples).
- If your project exports `auth` from `@/auth`, adjust the import at the top of this file.
*/
