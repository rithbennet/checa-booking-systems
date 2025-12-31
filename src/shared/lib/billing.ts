/**
 * Billing utilities
 * Helper functions for billing address display and formatting
 */

import type { UtmCampus } from "@/entities/organization/model/types";

// ==============================================================
// Campus Label
// ==============================================================

/**
 * Convert campus code to display label
 */
export function campusLabel(campus: UtmCampus | undefined): string {
	switch (campus) {
		case "kl":
			return "UTM Kuala Lumpur";
		case "johor_bahru":
			return "UTM Johor Bahru";
		default:
			return "";
	}
}

// ==============================================================
// Billing Address Display
// ==============================================================

export interface BillingAddressInput {
	department?: string | null;
	faculty?: string | null;
	utmCampus?: UtmCampus;
	organizationAddress?: string | null;
	isExternal?: boolean;
}

/**
 * Build a formatted billing address display string
 */
export function buildBillingAddressDisplay(input: BillingAddressInput): string {
	const { department, faculty, utmCampus, organizationAddress, isExternal } =
		input;

	// External members use organization address
	if (isExternal && organizationAddress) {
		return organizationAddress;
	}

	// Institutional members use department/faculty/campus
	const parts: string[] = [];

	if (department) {
		parts.push(department);
	}

	if (faculty) {
		parts.push(faculty);
	}

	const campus = campusLabel(utmCampus);
	if (campus) {
		parts.push(campus);
	}

	return parts.join(", ");
}

// Alias for backward compatibility
export const buildInvoiceAddressDisplay = buildBillingAddressDisplay;

// ==============================================================
// Temporary Reference
// ==============================================================

/**
 * Generate a temporary booking reference for preview purposes
 * Format: TEMP-YYYYMMDD-XXXX where X is random hex
 */
export function generateTempReference(): string {
	const date = new Date();
	const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
	const randomPart = Math.random().toString(16).slice(2, 6).toUpperCase();
	return `TEMP-${dateStr}-${randomPart}`;
}

// ==============================================================
// Payer Type Formatting
// ==============================================================

export type PayerType =
	| "staff"
	| "student-self"
	| "student-supervisor"
	| "external";

/**
 * Format payer type for display
 */
export function formatPayerType(payerType: PayerType | undefined): string {
	switch (payerType) {
		case "staff":
			return "Staff";
		case "student-self":
			return "Student (Self)";
		case "student-supervisor":
			return "Student (Supervisor)";
		case "external":
			return "External";
		default:
			return "Unknown";
	}
}

// Alias for backward compatibility
export const formatInvoicePayerType = formatPayerType;
