/**
 * User Modification Response API
 * PATCH - User approves or rejects a modification request
 */

import { NextResponse } from "next/server";
import { ZodError, z } from "zod";
import {
	notifyAdminModificationApproved,
	notifyAdminModificationRejected,
} from "@/entities/notification/server";
import {
	badRequest,
	createProtectedHandler,
	forbidden,
	notFound,
	serverError,
} from "@/shared/lib/api-factory";
import { db } from "@/shared/server/db";

const ResponseSchema = z.object({
	approved: z.boolean(),
	notes: z.string().optional(),
});

export const PATCH = createProtectedHandler(
	async (request: Request, user, { params }) => {
		try {
			const modificationId = params?.id;
			if (!modificationId) {
				return badRequest("Modification ID is required");
			}

			const body = await request.json();

			let validated: z.infer<typeof ResponseSchema>;
			try {
				validated = ResponseSchema.parse(body);
			} catch (zodError) {
				if (zodError instanceof ZodError) {
					return badRequest(
						zodError.errors[0]?.message || "Invalid request body",
					);
				}
				throw zodError;
			}

			// Get the modification with booking ownership check
			const modification = await db.sampleModification.findUnique({
				where: { id: modificationId },
				include: {
					bookingServiceItem: {
						include: {
							service: { select: { name: true } },
							bookingRequest: {
								select: {
									userId: true,
									id: true,
									totalAmount: true,
									referenceNumber: true,
									user: {
										select: {
											firstName: true,
											lastName: true,
										},
									},
								},
							},
						},
					},
					createdByUser: {
						select: {
							userType: true,
							firstName: true,
							lastName: true,
						},
					},
				},
			});

			if (!modification) {
				return notFound("Modification not found");
			}

			// Only the booking owner can respond to admin-initiated modifications
			const isBookingOwner =
				modification.bookingServiceItem.bookingRequest.userId === user.id;
			const isAdminInitiated =
				modification.createdByUser.userType === "lab_administrator";

			if (!isBookingOwner) {
				return forbidden(
					"You can only respond to modifications for your own bookings",
				);
			}

			// Users can only respond to admin-initiated modifications
			if (!isAdminInitiated) {
				return forbidden(
					"You cannot respond to your own modification requests",
				);
			}

			if (modification.status !== "pending") {
				return badRequest("This modification has already been processed");
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

			// If approved, update the booking service item and total
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

			// Create audit log
			await db.auditLog.create({
				data: {
					userId: user.id,
					action: validated.approved
						? "modification_approved"
						: "modification_rejected",
					entity: "SampleModification",
					entityId: modificationId,
					metadata: {
						bookingId: modification.bookingServiceItem.bookingRequest.id,
						referenceNumber:
							modification.bookingServiceItem.bookingRequest.referenceNumber,
						serviceName: modification.bookingServiceItem.service.name,
						originalQuantity: modification.originalQuantity,
						newQuantity: modification.newQuantity,
						priceDifference: validated.approved
							? Number(modification.newTotalPrice) -
								Number(modification.originalTotalPrice)
							: 0,
						notes: validated.notes,
					},
				},
			});

			// Get customer name for notification
			const bookingUser = modification.bookingServiceItem.bookingRequest.user;
			const customerName =
				`${bookingUser.firstName ?? ""} ${bookingUser.lastName ?? ""}`.trim() ||
				"Customer";

			// Send notification to admins about the decision
			if (validated.approved) {
				await notifyAdminModificationApproved({
					bookingId: modification.bookingServiceItem.bookingRequest.id,
					bookingReference:
						modification.bookingServiceItem.bookingRequest.referenceNumber,
					serviceName: modification.bookingServiceItem.service.name,
					customerName,
					originalQuantity: modification.originalQuantity,
					newQuantity: modification.newQuantity,
				});
			} else {
				await notifyAdminModificationRejected({
					bookingId: modification.bookingServiceItem.bookingRequest.id,
					bookingReference:
						modification.bookingServiceItem.bookingRequest.referenceNumber,
					serviceName: modification.bookingServiceItem.service.name,
					customerName,
				});
			}

			return NextResponse.json({
				id: updatedModification.id,
				bookingServiceItemId: updatedModification.bookingServiceItemId,
				originalQuantity: updatedModification.originalQuantity,
				newQuantity: updatedModification.newQuantity,
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
			console.error("[user/modifications/[id] PATCH]", error);
			return serverError("Failed to process modification response");
		}
	},
);
