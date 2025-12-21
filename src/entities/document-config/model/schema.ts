/**
 * Document Config Zod Schemas
 * Validation schemas for document configuration input/output
 */

import { z } from "zod";
import type { DocumentConfig } from "./types";

/**
 * Address schema
 */
const addressSchema = z.object({
	title: z.string().min(1, "Address title is required"),
	institute: z.string().min(1, "Institute is required"),
	university: z.string().min(1, "University is required"),
	street: z.string().min(1, "Street is required"),
	city: z.string().min(1, "City is required"),
	email: z.string().email("Invalid email address"),
});

/**
 * Staff PIC schema
 */
const staffPicSchema = z.object({
	name: z.string().min(1, "Staff PIC name is required"),
	fullName: z.string().min(1, "Full name is required"),
	email: z.string().email("Invalid email address"),
	phone: z.string().nullable(),
	title: z.string().nullable(),
	signatureBlobId: z.string().uuid().nullable(),
	signatureImageUrl: z.string().url().nullable(),
});

/**
 * Ikohza Head schema
 */
const ikohzaHeadSchema = z.object({
	name: z.string().min(1, "Ikohza head name is required"),
	title: z.string().nullable(),
	department: z.string().min(1, "Department is required"),
	institute: z.string().min(1, "Institute is required"),
	university: z.string().min(1, "University is required"),
	address: z.string().min(1, "Address is required"),
	signatureBlobId: z.string().uuid().nullable(),
	signatureImageUrl: z.string().url().nullable(),
});

/**
 * Full document config schema
 */
export const documentConfigSchema = z.object({
	id: z.string().uuid(),
	facilityName: z.string().min(1, "Facility name is required"),
	address: addressSchema,
	staffPic: staffPicSchema,
	ikohzaHead: ikohzaHeadSchema,
	ccRecipients: z.array(z.string()).min(0),
	facilities: z.array(z.string()).min(0),
	createdAt: z.date(),
	updatedAt: z.date(),
}) satisfies z.ZodType<DocumentConfig>;

/**
 * Update input schema (all fields optional, including nested object fields)
 * Uses .partial() to make all nested object fields optional
 * Note: This allows partial updates of nested objects (e.g., updating only signature fields)
 */
export const updateDocumentConfigSchema = z.object({
	facilityName: z.string().min(1).optional(),
	address: addressSchema.partial().optional(),
	staffPic: staffPicSchema.partial().optional(),
	ikohzaHead: ikohzaHeadSchema.partial().optional(),
	ccRecipients: z.array(z.string()).optional(),
	facilities: z.array(z.string()).optional(),
});
