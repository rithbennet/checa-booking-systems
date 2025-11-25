/**
 * Sample Modification Approval API
 * PATCH - Approve or reject a modification (by customer or admin)
 */

import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { ApproveModificationSchema } from "@/features/bookings/admin/details/lib/modification-types";
import {
	badRequest,
	createProtectedHandler,
	forbidden,
	serverError,
} from "@/shared/lib/api-factory";
import { db } from "@/shared/server/db";

export const PATCH = createProtectedHandler(
	async (request: Request, user, { params }) => {
		try {
			const modificationId = params?.id;
			if (!modificationId) {
				return badRequest("Modification ID is required");
			}

			const body = await request.json();

			let validated: ReturnType<typeof ApproveModificationSchema.parse>;
			try {
				validated = ApproveModificationSchema.parse({
					...body,
					modificationId,
				});
			} catch (zodError) {
				if (zodError instanceof ZodError) {
					return badRequest(
						zodError.errors[0]?.message || "Invalid request body",
					);
				}
				throw zodError;
			}

			// Get the modification with related data
			const modification = await db.sampleModification.findUnique({
				where: { id: modificationId },
				include: {
					bookingServiceItem: {
						include: {
							bookingRequest: {
								select: {
									userId: true,
									id: true,
									totalAmount: true,
								},
							},
						},
					},
				},
			});

			if (!modification) {
				return badRequest("Modification not found");
			}

			if (modification.status !== "pending") {
				return badRequest("Modification has already been processed");
			}

			// Check authorization - either customer (booking owner) or admin
			const isCustomer =
				modification.bookingServiceItem.bookingRequest.userId === user.id;
			const isAdmin = user.role === "lab_administrator";

			if (!isCustomer && !isAdmin) {
				return forbidden();
			}

			// Update modification status
			const updatedModification = await db.sampleModification.update({
				where: { id: modificationId },
				data: {
					status: validated.approved ? "approved" : "rejected",
					approvedAt: new Date(),
					approvedBy: user.id,
				},
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
			});

			// If approved, update the booking service item
			if (validated.approved) {
				const serviceItem = modification.bookingServiceItem;
				const priceDifference =
					Number(modification.newTotalPrice) -
					Number(modification.originalTotalPrice);

				await db.$transaction([
					// Update service item
					db.bookingServiceItem.update({
						where: { id: serviceItem.id },
						data: {
							quantity: modification.newQuantity,
							totalPrice: modification.newTotalPrice,
						},
					}),
					// Update booking total
					db.bookingRequest.update({
						where: { id: serviceItem.bookingRequest.id },
						data: {
							totalAmount: {
								increment: priceDifference,
							},
						},
					}),
				]);
			}

			// TODO: Send notification to admin/customer about the decision

			return NextResponse.json({
				id: updatedModification.id,
				bookingServiceItemId: updatedModification.bookingServiceItemId,
				originalQuantity: updatedModification.originalQuantity,
				newQuantity: updatedModification.newQuantity,
				originalDurationMonths: updatedModification.originalDurationMonths,
				newDurationMonths: updatedModification.newDurationMonths,
				originalTotalPrice: updatedModification.originalTotalPrice.toString(),
				newTotalPrice: updatedModification.newTotalPrice.toString(),
				reason: updatedModification.reason,
				status: updatedModification.status,
				createdBy: updatedModification.createdByUser,
				createdAt: updatedModification.createdAt.toISOString(),
				approvedAt: updatedModification.approvedAt?.toISOString() ?? null,
				approvedBy: updatedModification.approvedByUser,
			});
		} catch (error) {
			console.error("[admin/modifications/[id] PATCH]", error);
			return serverError("Failed to process modification");
		}
	},
);
