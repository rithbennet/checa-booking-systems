/**
 * Document Config Repository
 * Server-side repository for managing global facility/document configuration
 */

import { facilityDocumentConfig } from "@/shared/lib/pdf/config/facility-config";
import { db } from "@/shared/server/db";
import {
	documentConfigSchema,
	updateDocumentConfigSchema,
} from "../model/schema";
import type { DocumentConfig, UpdateDocumentConfigInput } from "../model/types";

/**
 * Safely parse a JSON field to a string array with runtime validation.
 * Logs warnings for non-string items that are filtered out and JSON parse errors.
 */
function parseJsonStringArray(value: unknown): string[] {
	// If it's already an array, filter and validate each item
	if (Array.isArray(value)) {
		const filtered = value.filter(
			(item): item is string => typeof item === "string",
		);
		const droppedCount = value.length - filtered.length;
		if (droppedCount > 0) {
			const droppedTypes = value
				.filter((item) => typeof item !== "string")
				.map((item) => typeof item);
			console.warn(
				"[DocumentConfig] parseJsonStringArray: Dropped non-string items",
				{ originalLength: value.length, droppedCount, droppedTypes },
			);
		}
		return filtered;
	}
	// If it's a string, try to parse it as JSON
	if (typeof value === "string") {
		try {
			const parsed = JSON.parse(value);
			if (Array.isArray(parsed)) {
				const filtered = parsed.filter(
					(item): item is string => typeof item === "string",
				);
				const droppedCount = parsed.length - filtered.length;
				if (droppedCount > 0) {
					const droppedTypes = parsed
						.filter((item) => typeof item !== "string")
						.map((item) => typeof item);
					console.warn(
						"[DocumentConfig] parseJsonStringArray: Dropped non-string items from parsed JSON",
						{ originalLength: parsed.length, droppedCount, droppedTypes },
					);
				}
				return filtered;
			}
		} catch (error) {
			console.warn(
				"[DocumentConfig] parseJsonStringArray: Failed to parse JSON string",
				{
					rawValue: value.slice(0, 100) + (value.length > 100 ? "..." : ""),
					error: error instanceof Error ? error.message : String(error),
				},
			);
		}
	}
	// Fallback to empty array
	return [];
}

/**
 * Build default document config from facility config
 */
function buildDefaultDocumentConfig(): DocumentConfig {
	return {
		id: "",
		facilityName: facilityDocumentConfig.facilityName,
		address: facilityDocumentConfig.address,
		staffPic: {
			name: facilityDocumentConfig.staffPic.name,
			fullName: facilityDocumentConfig.staffPic.fullName,
			email: facilityDocumentConfig.staffPic.email,
			phone: facilityDocumentConfig.staffPic.phone ?? null,
			title: facilityDocumentConfig.staffPic.title ?? null,
			signatureBlobId: facilityDocumentConfig.staffPic.signatureBlobId ?? null,
			signatureImageUrl:
				facilityDocumentConfig.staffPic.signatureImageUrl ?? null,
		},
		ikohzaHead: {
			name: facilityDocumentConfig.ikohzaHead.name,
			title: facilityDocumentConfig.ikohzaHead.title ?? null,
			department: facilityDocumentConfig.ikohzaHead.department,
			institute: facilityDocumentConfig.ikohzaHead.institute,
			university: facilityDocumentConfig.ikohzaHead.university,
			address: facilityDocumentConfig.ikohzaHead.address,
			signatureBlobId:
				facilityDocumentConfig.ikohzaHead.signatureBlobId ?? null,
			signatureImageUrl:
				facilityDocumentConfig.ikohzaHead.signatureImageUrl ?? null,
		},
		ccRecipients: [...facilityDocumentConfig.ccRecipients],
		facilities: [...facilityDocumentConfig.facilities],
		createdAt: new Date(),
		updatedAt: new Date(),
	};
}

/**
 * Get global document configuration
 * Reads from FacilityDocumentConfig table, falls back to hardcoded defaults
 */
export async function getGlobalDocumentConfig(): Promise<DocumentConfig> {
	const config = await db.facilityDocumentConfig.findUnique({
		where: { singletonKey: "default" },
		include: {
			staffPicSignature: true,
			ikohzaHeadSignature: true,
		},
	});

	if (!config) {
		// Return default config structure
		return buildDefaultDocumentConfig();
	}

	// Parse JSON fields with runtime validation
	const ccRecipients = parseJsonStringArray(config.ccRecipients);
	const facilities = parseJsonStringArray(config.facilities);

	// Build the config object
	const documentConfig: DocumentConfig = {
		id: config.id,
		facilityName: config.facilityName,
		address: {
			title: config.addressTitle,
			institute: config.addressInstitute,
			university: config.addressUniversity,
			street: config.addressStreet,
			city: config.addressCity,
			email: config.addressEmail,
		},
		staffPic: {
			name: config.staffPicName,
			fullName: config.staffPicFullName,
			email: config.staffPicEmail,
			phone: config.staffPicPhone ?? null,
			title: config.staffPicTitle ?? null,
			signatureBlobId: config.staffPicSignatureBlobId ?? null,
			signatureImageUrl: config.staffPicSignature?.url ?? null,
		},
		ikohzaHead: {
			name: config.ikohzaHeadName,
			title: config.ikohzaHeadTitle ?? null,
			department: config.ikohzaHeadDepartment,
			institute: config.ikohzaHeadInstitute,
			university: config.ikohzaHeadUniversity,
			address: config.ikohzaHeadAddress,
			signatureBlobId: config.ikohzaHeadSignatureBlobId ?? null,
			signatureImageUrl: config.ikohzaHeadSignature?.url ?? null,
		},
		ccRecipients,
		facilities,
		createdAt: config.createdAt,
		updatedAt: config.updatedAt,
	};

	// Validate and return
	try {
		const parsed = documentConfigSchema.parse(documentConfig);
		// Ensure all nullable fields are null, not undefined
		return {
			...parsed,
			staffPic: {
				...parsed.staffPic,
				phone: parsed.staffPic.phone ?? null,
				title: parsed.staffPic.title ?? null,
				signatureBlobId: parsed.staffPic.signatureBlobId ?? null,
				signatureImageUrl: parsed.staffPic.signatureImageUrl ?? null,
			},
			ikohzaHead: {
				...parsed.ikohzaHead,
				title: parsed.ikohzaHead.title ?? null,
				signatureBlobId: parsed.ikohzaHead.signatureBlobId ?? null,
				signatureImageUrl: parsed.ikohzaHead.signatureImageUrl ?? null,
			},
		};
	} catch (error) {
		console.error("Failed to parse document config from DB:", error);
		// Return defaults on parse error - use helper to avoid recursion
		return buildDefaultDocumentConfig();
	}
}

/**
 * Helper to build database fields from merged config
 * Used for both create and update operations to avoid duplication
 */
function buildDbFields(merged: DocumentConfig) {
	return {
		facilityName: merged.facilityName,
		addressTitle: merged.address.title,
		addressInstitute: merged.address.institute,
		addressUniversity: merged.address.university,
		addressStreet: merged.address.street,
		addressCity: merged.address.city,
		addressEmail: merged.address.email,
		staffPicName: merged.staffPic.name,
		staffPicFullName: merged.staffPic.fullName,
		staffPicEmail: merged.staffPic.email,
		staffPicPhone: merged.staffPic.phone,
		staffPicTitle: merged.staffPic.title,
		staffPicSignatureBlobId: merged.staffPic.signatureBlobId,
		ikohzaHeadName: merged.ikohzaHead.name,
		ikohzaHeadTitle: merged.ikohzaHead.title,
		ikohzaHeadDepartment: merged.ikohzaHead.department,
		ikohzaHeadInstitute: merged.ikohzaHead.institute,
		ikohzaHeadUniversity: merged.ikohzaHead.university,
		ikohzaHeadAddress: merged.ikohzaHead.address,
		ikohzaHeadSignatureBlobId: merged.ikohzaHead.signatureBlobId,
		ccRecipients: merged.ccRecipients,
		facilities: merged.facilities,
	};
}

/**
 * Update global document configuration
 * Upserts the single row in FacilityDocumentConfig table
 */
export async function updateGlobalDocumentConfig(
	input: UpdateDocumentConfigInput,
): Promise<DocumentConfig> {
	// Validate input
	const validated = updateDocumentConfigSchema.parse(input);

	// Get current config to merge with
	const current = await getGlobalDocumentConfig();

	// Merge updates with current config
	const merged: DocumentConfig = {
		...current,
		facilityName: validated.facilityName ?? current.facilityName,
		address: validated.address
			? {
					title: validated.address.title ?? current.address.title,
					institute: validated.address.institute ?? current.address.institute,
					university:
						validated.address.university ?? current.address.university,
					street: validated.address.street ?? current.address.street,
					city: validated.address.city ?? current.address.city,
					email: validated.address.email ?? current.address.email,
				}
			: current.address,
		staffPic: validated.staffPic
			? {
					name: validated.staffPic.name ?? current.staffPic.name,
					fullName: validated.staffPic.fullName ?? current.staffPic.fullName,
					email: validated.staffPic.email ?? current.staffPic.email,
					phone:
						validated.staffPic.phone !== undefined
							? validated.staffPic.phone
							: current.staffPic.phone,
					title:
						validated.staffPic.title !== undefined
							? validated.staffPic.title
							: current.staffPic.title,
					signatureBlobId:
						validated.staffPic.signatureBlobId !== undefined
							? validated.staffPic.signatureBlobId
							: current.staffPic.signatureBlobId,
					signatureImageUrl:
						validated.staffPic.signatureImageUrl !== undefined
							? validated.staffPic.signatureImageUrl
							: current.staffPic.signatureImageUrl,
				}
			: current.staffPic,
		ikohzaHead: validated.ikohzaHead
			? {
					name: validated.ikohzaHead.name ?? current.ikohzaHead.name,
					department:
						validated.ikohzaHead.department ?? current.ikohzaHead.department,
					institute:
						validated.ikohzaHead.institute ?? current.ikohzaHead.institute,
					university:
						validated.ikohzaHead.university ?? current.ikohzaHead.university,
					address: validated.ikohzaHead.address ?? current.ikohzaHead.address,
					title:
						validated.ikohzaHead.title !== undefined
							? validated.ikohzaHead.title
							: current.ikohzaHead.title,
					signatureBlobId:
						validated.ikohzaHead.signatureBlobId !== undefined
							? validated.ikohzaHead.signatureBlobId
							: current.ikohzaHead.signatureBlobId,
					signatureImageUrl:
						validated.ikohzaHead.signatureImageUrl !== undefined
							? validated.ikohzaHead.signatureImageUrl
							: current.ikohzaHead.signatureImageUrl,
				}
			: current.ikohzaHead,
		ccRecipients: validated.ccRecipients ?? current.ccRecipients,
		facilities: validated.facilities ?? current.facilities,
	};

	// Build fields once and reuse for both create and update
	const dbFields = buildDbFields(merged);

	// Upsert into database
	const updated = await db.facilityDocumentConfig.upsert({
		where: { singletonKey: "default" },
		create: {
			singletonKey: "default",
			...dbFields,
		},
		update: dbFields,
		include: {
			staffPicSignature: true,
			ikohzaHeadSignature: true,
		},
	});

	// Parse JSON fields with runtime validation
	const ccRecipients = parseJsonStringArray(updated.ccRecipients);
	const facilities = parseJsonStringArray(updated.facilities);

	// Return formatted config
	return {
		id: updated.id,
		facilityName: updated.facilityName,
		address: {
			title: updated.addressTitle,
			institute: updated.addressInstitute,
			university: updated.addressUniversity,
			street: updated.addressStreet,
			city: updated.addressCity,
			email: updated.addressEmail,
		},
		staffPic: {
			name: updated.staffPicName,
			fullName: updated.staffPicFullName,
			email: updated.staffPicEmail,
			phone: updated.staffPicPhone,
			title: updated.staffPicTitle,
			signatureBlobId: updated.staffPicSignatureBlobId,
			signatureImageUrl: updated.staffPicSignature?.url ?? null,
		},
		ikohzaHead: {
			name: updated.ikohzaHeadName,
			title: updated.ikohzaHeadTitle,
			department: updated.ikohzaHeadDepartment,
			institute: updated.ikohzaHeadInstitute,
			university: updated.ikohzaHeadUniversity,
			address: updated.ikohzaHeadAddress,
			signatureBlobId: updated.ikohzaHeadSignatureBlobId,
			signatureImageUrl: updated.ikohzaHeadSignature?.url ?? null,
		},
		ccRecipients,
		facilities,
		createdAt: updated.createdAt,
		updatedAt: updated.updatedAt,
	};
}

/**
 * Get effective facility config for PDF templates
 * Returns the exact shape expected by PDF templates (matching legacy facilityConfig structure)
 */
export async function getEffectiveFacilityConfigForPdf() {
	const config = await getGlobalDocumentConfig();

	return {
		facilityName: config.facilityName,
		staffPic: {
			name: config.staffPic.name,
			email: config.staffPic.email,
			fullName: config.staffPic.fullName,
			signatureImageUrl: config.staffPic.signatureImageUrl ?? null,
		},
		workArea: {
			signature: {
				name: config.ikohzaHead.name,
				department: config.ikohzaHead.department,
				institute: config.ikohzaHead.institute,
				university: config.ikohzaHead.university,
				address: config.ikohzaHead.address,
				signatureImageUrl: config.ikohzaHead.signatureImageUrl ?? null,
			},
			ccRecipients: config.ccRecipients as readonly string[],
			address: config.address,
			logos: {
				main: facilityDocumentConfig.logos.main,
				big: facilityDocumentConfig.logos.big,
			},
			facilities: config.facilities as readonly string[],
		},
	};
}
