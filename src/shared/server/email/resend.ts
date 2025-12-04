/**
 * Resend Email Client
 * Singleton instance of the Resend client for sending emails
 */

import { Resend } from "resend";
import { env } from "@/env";

// Create Resend client instance (will be null if API key is not configured)
export const resend = env.RESEND_API_KEY
	? new Resend(env.RESEND_API_KEY)
	: null;

// Log warning once at startup if email is not configured
if (!resend) {
	console.warn(
		"[Email] RESEND_API_KEY not configured. Emails will be skipped.",
	);
}

/**
 * Check if email sending is enabled via configuration
 * Returns false if:
 * - RESEND_API_KEY is not set
 * - EMAIL_ENABLED is explicitly set to "false"
 */
export function isEmailEnabled(): boolean {
	if (!resend) return false;
	return env.EMAIL_ENABLED !== "false";
}

/**
 * Get the default from email address
 */
export function getFromEmail(): string {
	return env.EMAIL_FROM ?? "CHECA <noreply@rith.dev>";
}

/**
 * Get the reply-to email address (optional)
 */
export function getReplyToEmail(): string | undefined {
	return env.EMAIL_REPLY_TO;
}

/**
 * Get the redirect email address for staging/testing
 * When set, all emails will be sent to this address instead of the intended recipient
 */
export function getEmailRedirectTo(): string | undefined {
	return env.EMAIL_REDIRECT_TO;
}

/**
 * Check if emails should be redirected (for staging/testing)
 */
export function shouldRedirectEmails(): boolean {
	return Boolean(env.EMAIL_REDIRECT_TO);
}
