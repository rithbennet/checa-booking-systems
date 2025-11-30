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

/**
 * Check if email sending is enabled
 */
export function isEmailEnabled(): boolean {
	return !!resend;
}

/**
 * Get the default from email address
 */
export function getFromEmail(): string {
	return env.EMAIL_FROM ?? "ChECA Lab <noreply@checa.lab>";
}

/**
 * Get the reply-to email address (optional)
 */
export function getReplyToEmail(): string | undefined {
	return env.EMAIL_REPLY_TO;
}
