/**
 * API Middleware utilities for authentication and rate limiting
 */

import { NextResponse } from "next/server";
import { auth } from "./auth";

export interface AuthenticatedRequest {
	session: NonNullable<Awaited<ReturnType<typeof auth>>>;
	user: NonNullable<Awaited<ReturnType<typeof auth>>>["user"] & {
		appUserId: string | null;
		role: string | null;
		status: string | null;
	};
}

/**
 * Check if user is authenticated and has appUserId
 * Returns session and user if authenticated, null otherwise
 */
export async function requireAuth(): Promise<AuthenticatedRequest | null> {
	const session = await auth();
	if (!session || !session.user || !session.user.appUserId) {
		return null;
	}
	return {
		session,
		user: session.user as AuthenticatedRequest["user"],
	};
}

/**
 * Check if user has active status (not pending, inactive, or rejected)
 */
export function isUserActive(
	authResult: AuthenticatedRequest | null,
): authResult is AuthenticatedRequest & { user: { status: "active" } } {
	return authResult !== null && authResult.user.status === "active";
}

/**
 * Create an unauthorized response
 */
export function unauthorizedResponse(message = "Unauthorized") {
	return NextResponse.json({ error: message }, { status: 401 });
}

/**
 * Create a forbidden response
 */
export function forbiddenResponse(message = "Forbidden") {
	return NextResponse.json({ error: message }, { status: 403 });
}

/**
 * Create a bad request response
 */
export function badRequestResponse(message = "Bad Request") {
	return NextResponse.json({ error: message }, { status: 400 });
}

/**
 * Create an internal server error response
 */
export function internalErrorResponse(message = "Internal Server Error") {
	return NextResponse.json({ error: message }, { status: 500 });
}

/**
 * Rate limiting store (in-memory)
 * In production, use Redis or a proper rate limiting service
 */
class RateLimiter {
	private requests: Map<string, { count: number; resetAt: number }> = new Map();

	/**
	 * Check if request should be rate limited
	 * @param identifier - Unique identifier (IP, user ID, etc.)
	 * @param maxRequests - Maximum requests allowed
	 * @param windowMs - Time window in milliseconds
	 * @returns true if rate limit exceeded, false otherwise
	 */
	check(
		identifier: string,
		maxRequests: number,
		windowMs: number,
	): { allowed: boolean; remaining: number; resetAt: number } {
		const now = Date.now();
		const record = this.requests.get(identifier);

		// Clean up old entries periodically
		if (this.requests.size > 10000) {
			this.cleanup(now);
		}

		if (!record || record.resetAt < now) {
			// New window or expired
			this.requests.set(identifier, {
				count: 1,
				resetAt: now + windowMs,
			});
			return {
				allowed: true,
				remaining: maxRequests - 1,
				resetAt: now + windowMs,
			};
		}

		if (record.count >= maxRequests) {
			return {
				allowed: false,
				remaining: 0,
				resetAt: record.resetAt,
			};
		}

		record.count += 1;
		return {
			allowed: true,
			remaining: maxRequests - record.count,
			resetAt: record.resetAt,
		};
	}

	private cleanup(now: number) {
		for (const [key, value] of this.requests.entries()) {
			if (value.resetAt < now) {
				this.requests.delete(key);
			}
		}
	}
}

const rateLimiter = new RateLimiter();

/**
 * Get client identifier from request
 */
export function getClientIdentifier(request: Request): string {
	// Try to get user ID from session first
	// Fallback to IP address
	const forwarded = request.headers.get("x-forwarded-for");
	const ip = forwarded
		? (forwarded.split(",")[0]?.trim() ?? "unknown")
		: (request.headers.get("x-real-ip") ?? "unknown");

	return ip;
}

/**
 * Rate limit middleware
 * @param request - Request object
 * @param maxRequests - Maximum requests allowed (default: 100)
 * @param windowMs - Time window in milliseconds (default: 60000 = 1 minute)
 * @returns NextResponse with rate limit headers if exceeded, null otherwise
 */
export async function rateLimit(
	request: Request,
	maxRequests = 100,
	windowMs = 60000,
): Promise<NextResponse | null> {
	// Build a route-scoped key so different endpoints don't share the same bucket
	// This prevents PATCH autosaves from consuming the POST /submit budget.
	const ip = getClientIdentifier(request);
	const url = new URL(request.url);
	const scopeKey = `${ip}|${request.method}|${url.pathname}`;
	const result = rateLimiter.check(scopeKey, maxRequests, windowMs);

	if (!result.allowed) {
		const response = NextResponse.json(
			{
				error: "Too Many Requests",
				message: "Rate limit exceeded. Please try again later.",
			},
			{ status: 429 },
		);

		// Add rate limit headers
		response.headers.set("X-RateLimit-Limit", maxRequests.toString());
		response.headers.set("X-RateLimit-Remaining", result.remaining.toString());
		response.headers.set(
			"X-RateLimit-Reset",
			new Date(result.resetAt).toISOString(),
		);
		const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);
		response.headers.set("Retry-After", Math.max(0, retryAfter).toString());

		return response;
	}

	return null;
}

/**
 * Wrapper for authenticated API routes
 * Ensures user is authenticated and optionally active
 */
export function withAuth<T = unknown>(
	handler: (
		request: Request,
		auth: AuthenticatedRequest,
		context?: { params?: Promise<Record<string, string>> },
	) => Promise<NextResponse | T>,
	options: {
		requireActive?: boolean;
		rateLimit?: { maxRequests?: number; windowMs?: number };
	} = {},
) {
	return async (
		request: Request,
		context?: { params?: Promise<Record<string, string>> },
	): Promise<NextResponse> => {
		try {
			// Rate limiting
			if (options.rateLimit) {
				const rateLimitResponse = await rateLimit(
					request,
					options.rateLimit.maxRequests,
					options.rateLimit.windowMs,
				);
				if (rateLimitResponse) {
					return rateLimitResponse;
				}
			}

			// Authentication check
			const authResult = await requireAuth();
			if (!authResult) {
				return unauthorizedResponse("Authentication required");
			}

			// Active status check
			if (options.requireActive && !isUserActive(authResult)) {
				return forbiddenResponse(
					"Your account is not active. Please contact an administrator.",
				);
			}

			// Execute handler
			const result = await handler(request, authResult, context);

			// If handler returns a NextResponse, return it directly
			if (result instanceof NextResponse) {
				return result;
			}

			// Otherwise, wrap in JSON response
			return NextResponse.json(result);
		} catch (error) {
			console.error("API Error:", error);
			return internalErrorResponse(
				error instanceof Error ? error.message : "An unexpected error occurred",
			);
		}
	};
}
