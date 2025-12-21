/**
 * Document Config Types
 * Type definitions for global facility/document configuration
 */

import type { facilityDocumentConfig } from "@/shared/lib/pdf/config/facility-config";

/**
 * Global document configuration matching the database model structure
 */
export interface DocumentConfig {
	id: string;
	facilityName: string;
	address: {
		title: string;
		institute: string;
		university: string;
		street: string;
		city: string;
		email: string;
	};
	staffPic: {
		name: string;
		fullName: string;
		email: string;
		phone: string | null;
		title: string | null;
		signatureBlobId: string | null;
		signatureImageUrl: string | null;
	};
	ikohzaHead: {
		name: string;
		title: string | null;
		department: string;
		institute: string;
		university: string;
		address: string;
		signatureBlobId: string | null;
		signatureImageUrl: string | null;
	};
	ccRecipients: string[];
	facilities: string[];
	createdAt: string;
	updatedAt: string;
}

/**
 * Default facility config type (for fallback)
 */
export type DefaultDocumentConfig = typeof facilityDocumentConfig;

/**
 * Input type for updates (allows partial updates)
 */
export type UpdateDocumentConfigInput = Partial<
	Omit<DocumentConfig, "id" | "createdAt" | "updatedAt">
>;
