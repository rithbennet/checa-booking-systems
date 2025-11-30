import { customSessionClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import type { auth } from "./config";

export const authClient = createAuthClient({
	// Use empty string for same-origin requests in Next.js
	// This ensures the client makes requests to the current origin
	baseURL:
		typeof window !== "undefined"
			? "" // Client-side: use relative URL (same origin)
			: (process.env.NEXT_PUBLIC_BETTER_AUTH_URL ?? "http://localhost:3000"), // Server-side: use absolute URL
	plugins: [customSessionClient<typeof auth>()],
});

export type Session = typeof authClient.$Infer.Session;
