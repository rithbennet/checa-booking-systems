/**
 * Invoice entity types
 *
 * Entities encapsulate core business concepts that can be reused across features.
 */

export type InvoicePayerType =
	| "external"
	| "staff"
	| "student-self"
	| "student-supervisor";

export interface InvoiceProfile {
	fullName: string;
	email?: string | null;
	phone?: string | null;
	academicType?: "student" | "staff" | "none" | null;
	supervisorName?: string | null;
	department?: string | null;
	faculty?: string | null;
	utmCampus?: "kl" | "johor_bahru" | null;
	organizationAddress?: string | null;
	organizationName?: string | null;
}

export interface InvoicePayerDetails {
	type: InvoicePayerType;
	name: string;
	address?: string;
	campusLabel?: string;
	phone?: string;
	email?: string;
	department?: string | null;
	faculty?: string | null;
	organizationName?: string | null;
}
