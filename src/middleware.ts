/**
 * Global security middleware (Option B - Security only).
 *
 * DEPRECATION: This middleware no longer performs application auth/ownership/role checks.
 * Those checks have moved to per-route handlers via the API factory in `src/shared/lib/api-factory.ts`
 * and auth utilities in `@/shared/server/auth` (Option C).
 *
 * Responsibilities now limited to:
 *  - Add security response headers (X-Content-Type-Options, X-Frame-Options, Referrer-Policy)
 *  - Enforce a basic CSRF check for state-changing /api/* requests
 *
 * Migration helper:
 *  - Set `DEPRECATE_API_MIDDLEWARE=true` (or 1) to attach an `X-Deprecated-Auth-Middleware: on` header
 *    and log a one-time deprecation warning at startup.
 */

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// Runtime toggle to surface deprecation during migration
const DEPRECATE =
  (process.env.DEPRECATE_API_MIDDLEWARE || "")
    .toString()
    .toLowerCase() === "true" || process.env.DEPRECATE_API_MIDDLEWARE === "1";
let WARNED = false;

// Option B middleware: global security headers, CSRF for state-changing API
// requests and a coarse admin gate for /api/admin/*.
export function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // If we are going to short-circuit with a JSON error, build headers to include
  const baseHeaders = new Headers();
  baseHeaders.set("X-Content-Type-Options", "nosniff");
  baseHeaders.set("X-Frame-Options", "DENY");
  baseHeaders.set("Referrer-Policy", "strict-origin-when-cross-origin");
  if (DEPRECATE) {
    baseHeaders.set("X-Deprecated-Auth-Middleware", "on");
  }

  // Enforce CSRF for state-changing API requests
  if (pathname.startsWith("/api/")) {
    const method = req.method?.toUpperCase() ?? "GET";
    const stateChanging = ["POST", "PUT", "PATCH", "DELETE"].includes(method);

    if (stateChanging) {
      const origin = req.headers.get("origin");
      const host = req.headers.get("host");

      // Enforce same-origin by checking that Origin contains Host.
      // If Origin is missing or doesn't include host, block the request.
      if (!origin || !host || !origin.includes(host)) {
        return NextResponse.json(
          { error: "CSRF blocked" },
          { status: 403, headers: Object.fromEntries(baseHeaders) }
        );
      }
    }

    // NOTE: per-route auth/role checks should be performed inside handlers.
    // We intentionally avoid application-level RBAC here so handlers can
    // use the API factory (createProtectedHandler) to enforce roles.
  }

  // For allowed requests attach security headers and continue
  const res = NextResponse.next();
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  if (DEPRECATE) {
    res.headers.set("X-Deprecated-Auth-Middleware", "on");
    if (!WARNED) {
      // eslint-disable-next-line no-console
      console.warn(
        "[DEPRECATION] Auth/role checks were removed from middleware. Use createProtectedHandler (src/shared/lib/api-factory.ts) in route handlers. Set DEPRECATE_API_MIDDLEWARE=false to silence this during migration."
      );
      WARNED = true;
    }
  }

  return res;
}

export const config = {
  // Match everything except Next.js internals and common static asset extensions
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|gif|webp|avif)).*)",
  ],
};
