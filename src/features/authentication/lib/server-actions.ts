"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth as betterAuth } from "@/shared/server/better-auth";

/**
 * Server action for email/password sign in
 */
export async function login(formData: FormData) {
	const emailEntry = formData.get("email");
	const passwordEntry = formData.get("password");
	const email = typeof emailEntry === "string" ? emailEntry : "";
	const password = typeof passwordEntry === "string" ? passwordEntry : "";

	try {
		// Get headers for Better Auth to set cookies
		const headersList = await headers();
		const result = await betterAuth.api.signInEmail({
			body: {
				email,
				password,
			},
			headers: headersList,
		});

		// Better Auth's signInEmail returns { token, user } directly, not wrapped in data
		if (result.user && result.token) {
			// Better Auth should have set the cookie via headers
			redirect("/dashboard");
		} else {
			console.error("Sign in failed: No user or token returned");
			redirect("/signIn?error=Invalid credentials");
		}
	} catch (error) {
		console.error("Sign in error:", error);
		redirect("/signIn?error=Invalid credentials");
	}
}

/**
 * Server action for Google OAuth sign in
 */
export async function loginWithGoogle() {
	const result = await betterAuth.api.signInSocial({
		body: {
			provider: "google",
			callbackURL: "/dashboard",
		},
	});

	if (result.url) {
		redirect(result.url);
	} else {
		redirect("/signIn?error=Social sign in failed");
	}
}
