/**
 * Sample Modification Types
 * Types for sample modification requests with customer approval workflow
 */

import { z } from "zod";

export type ModificationStatus = "pending" | "approved" | "rejected";

export interface SampleModificationVM {
	id: string;
	bookingServiceItemId: string;
	originalQuantity: number;
	newQuantity: number;
	originalDurationMonths: number;
	newDurationMonths: number;
	originalTotalPrice: string;
	newTotalPrice: string;
	reason: string;
	status: ModificationStatus;
	createdBy: { firstName: string; lastName: string };
	createdAt: string;
	approvedAt: string | null;
	approvedBy: { firstName: string; lastName: string } | null;
}

export const CreateModificationSchema = z.object({
	bookingServiceItemId: z.string().uuid("Invalid service item ID"),
	newQuantity: z.number().int().min(1, "Quantity must be at least 1"),
	newDurationMonths: z.number().int().min(0, "Duration cannot be negative"),
	reason: z
		.string()
		.min(10, "Please provide a detailed reason (at least 10 characters)"),
});

export type CreateModificationInput = z.infer<typeof CreateModificationSchema>;

export const ApproveModificationSchema = z.object({
	modificationId: z.string().uuid("Invalid modification ID"),
	approved: z.boolean(),
	notes: z.string().optional(),
});

export type ApproveModificationInput = z.infer<
	typeof ApproveModificationSchema
>;
