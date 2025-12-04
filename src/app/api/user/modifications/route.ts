/**
 * User Modification Request API
 * POST - User creates a new modification request for their booking
 */

import { NextResponse } from "next/server";
import { ZodError, z } from "zod";
import { notifyAdminUserModificationRequested } from "@/entities/notification/server";
import {
	badRequest,
	createProtectedHandler,
	forbidden,
	notFound,
	serverError,
} from "@/shared/lib/api-factory";
import { db } from "@/shared/server/db";

const CreateRequestSchema = z.object({
	bookingServiceItemId: z.string().uuid("Invalid service item ID"),
	newQuantity: z.number().int().min(1, "Quantity must be at least 1"),
	reason: z
		.string()
		.min(10, "Please provide a detailed reason (at least 10 characters)"),
});

export const POST = createProtectedHandler(async (request: Request, user) => {
	try {
		const body = await request.json();

		let validated: z.infer<typeof CreateRequestSchema>;
		try {
			validated = CreateRequestSchema.parse(body);
		} catch (zodError) {
			if (zodError instanceof ZodError) {
				return badRequest(
					zodError.errors[0]?.message || "Invalid request body",
				);
			}
			throw zodError;
		}

		// Get the service item with booking ownership check
		const serviceItem = await db.bookingServiceItem.findUnique({
			where: { id: validated.bookingServiceItemId },
			include: {
				service: {
					include: {
						pricing: true,
					},
				},
				bookingRequest: {
					select: {
						userId: true,
						id: true,
						referenceNumber: true,
						status: true,
						user: {
							select: { userType: true },
						},
					},
				},
			},
		});

		if (!serviceItem) {
			return notFound("Service item not found");
		}

		// Check ownership
		if (serviceItem.bookingRequest.userId !== user.id) {
			return forbidden(
				"You can only request modifications for your own bookings",
			);
		}

		// Only allow modifications for approved/in_progress bookings
		const allowedStatuses = ["approved", "in_progress"];
		if (!allowedStatuses.includes(serviceItem.bookingRequest.status)) {
			return badRequest(
				"Modifications can only be requested for approved or in-progress bookings",
			);
		}

		// Check for existing pending modification
		const existingPending = await db.sampleModification.findFirst({
			where: {
				bookingServiceItemId: validated.bookingServiceItemId,
				status: "pending",
			},
		});

		if (existingPending) {
			return badRequest(
				"There is already a pending modification for this service item",
			);
		}

		// Calculate new price based on user type
		const userType = serviceItem.bookingRequest.user.userType;
		const pricing = serviceItem.service.pricing.find(
			(p) => p.userType === userType,
		);
		const unitPrice = pricing
			? Number(pricing.price)
			: Number(serviceItem.unitPrice);
		const newTotalPrice = unitPrice * validated.newQuantity;

		// Create modification request
		const modification = await db.sampleModification.create({
			data: {
				bookingServiceItemId: validated.bookingServiceItemId,
				originalQuantity: serviceItem.quantity,
				newQuantity: validated.newQuantity,
				originalDurationMonths: 0,
				newDurationMonths: 0,
				originalTotalPrice: serviceItem.totalPrice,
				newTotalPrice,
				reason: validated.reason,
				status: "pending",
				createdBy: user.id,
			},
			include: {
				createdByUser: {
					select: {
						firstName: true,
						lastName: true,
					},
				},
			},
		});

		// Create audit log
		await db.auditLog.create({
			data: {
				userId: user.id,
				action: "modification_requested",
				entity: "SampleModification",
				entityId: modification.id,
				metadata: {
					bookingId: serviceItem.bookingRequest.id,
					referenceNumber: serviceItem.bookingRequest.referenceNumber,
					serviceName: serviceItem.service.name,
					originalQuantity: serviceItem.quantity,
					newQuantity: validated.newQuantity,
					reason: validated.reason,
					initiatedBy: "user",
				},
			},
		});

		// Get customer name for notification
		const customerName =
			`${modification.createdByUser.firstName ?? ""} ${modification.createdByUser.lastName ?? ""}`.trim() ||
			"Customer";

		// Notify admins about the modification request
		await notifyAdminUserModificationRequested({
			bookingId: serviceItem.bookingRequest.id,
			bookingReference: serviceItem.bookingRequest.referenceNumber,
			serviceName: serviceItem.service.name,
			customerName,
			originalQuantity: serviceItem.quantity,
			newQuantity: validated.newQuantity,
			reason: validated.reason,
		});

		return NextResponse.json({
			id: modification.id,
			bookingServiceItemId: modification.bookingServiceItemId,
			originalQuantity: modification.originalQuantity,
			newQuantity: modification.newQuantity,
			originalTotalPrice: modification.originalTotalPrice.toString(),
			newTotalPrice: modification.newTotalPrice.toString(),
			reason: modification.reason,
			status: modification.status,
			createdBy: modification.createdByUser,
			createdAt: modification.createdAt.toISOString(),
			approvedAt: null,
			approvedBy: null,
		});
	} catch (error) {
		console.error("[user/modifications POST]", error);
		return serverError("Failed to create modification request");
	}
});
