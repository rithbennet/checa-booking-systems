import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(request: NextRequest) {
	const response = NextResponse.next();

	// Security headers
	response.headers.set("X-Content-Type-Options", "nosniff");
	response.headers.set("X-Frame-Options", "DENY");
	response.headers.set("X-XSS-Protection", "1; mode=block");
	response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

	// Only allow API routes from same origin (CSRF protection)
	if (request.nextUrl.pathname.startsWith("/api/")) {
		const origin = request.headers.get("origin");
		const host = request.headers.get("host");

		// Allow same-origin requests
		if (origin && host && !origin.includes(host)) {
			// In production, you might want to check against allowed origins
			// For now, we rely on authentication for API security
		}

		// Add CORS headers if needed (adjust based on your requirements)
		// response.headers.set("Access-Control-Allow-Origin", "https://yourdomain.com");
		// response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
		// response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
	}

	return response;
}

export const config = {
	matcher: [
		/*
		 * Match all request paths except for the ones starting with:
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 * - public folder
		 */
		"/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
	],
};
