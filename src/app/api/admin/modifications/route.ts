/**
 * Sample Modifications API
 * POST - Create a new modification request
 * GET - List modifications for a booking service item
 */

import { NextResponse } from "next/server";
import { ZodError, type z } from "zod";
import { CreateModificationSchema } from "@/features/bookings/admin/details/lib/modification-types";
import {
	badRequest,
	createProtectedHandler,
	forbidden,
	serverError,
} from "@/shared/lib/api-factory";
import { db } from "@/shared/server/db";

export const POST = createProtectedHandler(async (request: Request, user) => {
	try {
		if (user.role !== "lab_administrator") return forbidden();

		const body = await request.json();

		let validated: z.infer<typeof CreateModificationSchema>;
		try {
			validated = CreateModificationSchema.parse(body);
		} catch (zodError) {
			if (zodError instanceof ZodError) {
				return badRequest(
					zodError.errors[0]?.message || "Invalid request body",
				);
			}
			throw zodError;
		}

		// Get the current booking service item
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
						user: {
							select: {
								userType: true,
							},
						},
					},
				},
			},
		});

		if (!serviceItem) {
			return badRequest("Service item not found");
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
				originalDurationMonths: 0, // Default, can be extended for workspace bookings
				newDurationMonths: validated.newDurationMonths,
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

		// TODO: Send notification to customer for approval
		// await notifyCustomerOfModification(serviceItem.bookingRequest.userId, modification.id);

		return NextResponse.json({
			id: modification.id,
			bookingServiceItemId: modification.bookingServiceItemId,
			originalQuantity: modification.originalQuantity,
			newQuantity: modification.newQuantity,
			originalDurationMonths: modification.originalDurationMonths,
			newDurationMonths: modification.newDurationMonths,
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
		console.error("[admin/modifications POST]", error);
		return serverError("Failed to create modification request");
	}
});

export const GET = createProtectedHandler(async (request: Request) => {
	try {
		const url = new URL(request.url);
		const bookingServiceItemId = url.searchParams.get("bookingServiceItemId");

		if (!bookingServiceItemId) {
			return badRequest("bookingServiceItemId is required");
		}

		const modifications = await db.sampleModification.findMany({
			where: { bookingServiceItemId },
			include: {
				createdByUser: {
					select: {
						firstName: true,
						lastName: true,
					},
				},
				approvedByUser: {
					select: {
						firstName: true,
						lastName: true,
					},
				},
			},
			orderBy: { createdAt: "desc" },
		});

		return NextResponse.json(
			modifications.map((m) => ({
				id: m.id,
				bookingServiceItemId: m.bookingServiceItemId,
				originalQuantity: m.originalQuantity,
				newQuantity: m.newQuantity,
				originalDurationMonths: m.originalDurationMonths,
				newDurationMonths: m.newDurationMonths,
				originalTotalPrice: m.originalTotalPrice.toString(),
				newTotalPrice: m.newTotalPrice.toString(),
				reason: m.reason,
				status: m.status,
				createdBy: m.createdByUser,
				createdAt: m.createdAt.toISOString(),
				approvedAt: m.approvedAt?.toISOString() ?? null,
				approvedBy: m.approvedByUser,
			})),
		);
	} catch (error) {
		console.error("[admin/modifications GET]", error);
		return serverError("Failed to fetch modifications");
	}
});
