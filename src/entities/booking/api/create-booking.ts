/**
 * Server-side function to create a booking request
 */

import { db } from "@/shared/server/db";
import type { CreateBookingInput } from "../model/schemas";

export interface CreateBookingResult {
	id: string;
	referenceNumber: string;
	status: string;
}

/**
 * Generate a unique reference number for booking
 */
function generateReferenceNumber(): string {
	const prefix = "CHECA";
	const timestamp = Date.now().toString(36).toUpperCase();
	const random = Math.random().toString(36).substring(2, 6).toUpperCase();
	return `${prefix}-${timestamp}-${random}`;
}

/**
 * Calculate total amount for booking based on service items, workspace bookings, and user type
 */
async function calculateTotalAmount(
	serviceItems: CreateBookingInput["serviceItems"] = [],
	workspaceBookings: CreateBookingInput["workspaceBookings"] = [],
	userId: string,
): Promise<{
	total: number;
	itemPrices: Map<string, { unitPrice: number; totalPrice: number }>;
	workspaceTotal: number;
}> {
	// Get user type once
	const user = await db.user.findUnique({
		where: { id: userId },
		select: { userType: true },
	});

	if (!user) {
		throw new Error("User not found");
	}

	const userType = user.userType;
	let total = 0;
	let workspaceTotal = 0;
	const itemPrices = new Map<
		string,
		{ unitPrice: number; totalPrice: number }
	>();

	// Calculate service items total
	if (serviceItems.length > 0) {
		const serviceIds = serviceItems.map((item) => item.serviceId);
		const services = await db.service.findMany({
			where: { id: { in: serviceIds } },
			include: {
				pricing: {
					where: {
						userType: userType as any,
						effectiveTo: null,
					},
				},
			},
		});

		// Create a map for quick lookup
		const serviceMap = new Map(services.map((s) => [s.id, s]));

		for (const item of serviceItems) {
			const service = serviceMap.get(item.serviceId);
			if (!service || !service.pricing[0]) {
				continue;
			}

			const unitPrice = Number(service.pricing[0].price);
			const isWorkingSpace = service.category === "working_space";
			const itemTotalPrice = isWorkingSpace
				? unitPrice * (item.durationMonths || 0)
				: unitPrice * (item.quantity || 1);

			total += itemTotalPrice;
			itemPrices.set(item.serviceId, {
				unitPrice,
				totalPrice: itemTotalPrice,
			});
		}
	}

	// Calculate workspace bookings total
	if (workspaceBookings.length > 0) {
		// Get workspace service pricing
		const workspaceService = await db.service.findFirst({
			where: {
				category: "working_space",
				isActive: true,
			},
			include: {
				pricing: {
					where: {
						userType: userType as any,
						effectiveTo: null,
					},
				},
			},
		});

		if (workspaceService?.pricing[0]) {
			const unitPrice = Number(workspaceService.pricing[0].price);
			const _unit = workspaceService.pricing[0].unit;

			// Calculate months for each workspace booking
			for (const workspace of workspaceBookings) {
				const startDate = new Date(workspace.startDate);
				const endDate = new Date(workspace.endDate);
				const months = Math.ceil(
					(endDate.getTime() - startDate.getTime()) /
						(1000 * 60 * 60 * 24 * 30),
				);
				const monthsToCharge = Math.max(1, months); // Minimum 1 month
				workspaceTotal += unitPrice * monthsToCharge;
			}
		}
	}

	return { total, itemPrices, workspaceTotal };
}

/**
 * Create a new booking request
 */
export async function createBooking(
	input: CreateBookingInput,
	userId: string,
): Promise<CreateBookingResult> {
	// Generate reference number
	const referenceNumber = generateReferenceNumber();

	// Calculate total amount and item prices
	const {
		total: serviceTotal,
		itemPrices,
		workspaceTotal,
	} = await calculateTotalAmount(
		input.serviceItems || [],
		input.workspaceBookings || [],
		userId,
	);

	let totalAmount = serviceTotal + workspaceTotal;

	// Create booking request with calculated prices
	const booking = await db.bookingRequest.create({
		data: {
			userId,
			referenceNumber,
			projectDescription: input.projectDescription,
			preferredStartDate: input.preferredStartDate,
			preferredEndDate: input.preferredEndDate,
			totalAmount,
			status: "pending_user_verification",
			notes: input.notes,
			serviceItems: {
				create: (input.serviceItems || []).map((item) => {
					const prices = itemPrices.get(item.serviceId) || {
						unitPrice: 0,
						totalPrice: 0,
					};
					return {
						serviceId: item.serviceId,
						quantity: item.quantity || 1,
						durationMonths: item.durationMonths || 0,
						unitPrice: prices.unitPrice,
						totalPrice: prices.totalPrice,
						sampleName: item.sampleName,
						sampleDetails: item.sampleDetails,
						sampleType: item.sampleType,
						sampleHazard: item.sampleHazard,
						testingMethod: item.testingMethod,
						degasConditions: item.degasConditions,
						solventSystem: item.solventSystem,
						solvents: item.solvents,
						solventComposition: item.solventComposition,
						columnType: item.columnType,
						flowRate: item.flowRate,
						wavelength: item.wavelength,
						expectedRetentionTime: item.expectedRetentionTime,
						samplePreparation: item.samplePreparation,
						notes: item.notes,
						temperatureControlled: item.temperatureControlled ?? false,
						lightSensitive: item.lightSensitive ?? false,
						hazardousMaterial: item.hazardousMaterial ?? false,
						inertAtmosphere: item.inertAtmosphere ?? false,
					};
				}),
			},
			workspaceBookings: {
				create: (input.workspaceBookings || []).map((workspace) => ({
					startDate: new Date(workspace.startDate),
					endDate: new Date(workspace.endDate),
					preferredTimeSlot: workspace.preferredTimeSlot,
					purpose: workspace.purpose,
					notes: workspace.notes,
					specialEquipment: workspace.specialEquipment
						? JSON.stringify(workspace.specialEquipment)
						: null,
				})),
			},
		},
		include: {
			serviceItems: true,
			workspaceBookings: true,
		},
	});

	// Process add-ons for each service item
	let addOnTotal = 0;
	for (let i = 0; i < (input.serviceItems || []).length; i++) {
		const item = input.serviceItems[i];
		const createdItem = booking.serviceItems[i];
		const addOnIds = item.addOnIds || [];

		if (addOnIds.length > 0) {
			// Fetch add-on mappings to get pricing information
			const mappings = await db.serviceAddOnMapping.findMany({
				where: {
					serviceId: item.serviceId,
					addOnId: { in: addOnIds },
					isEnabled: true,
				},
				include: {
					addOnCatalog: true,
				},
			});

			// Create ServiceAddOn records
			for (const mapping of mappings) {
				const effectiveAmount = Number(
					mapping.customAmount ?? mapping.addOnCatalog.defaultAmount,
				);
				addOnTotal += effectiveAmount;

				await db.serviceAddOn.create({
					data: {
						bookingServiceItemId: createdItem.id,
						addOnCatalogId: mapping.addOnId,
						name: mapping.addOnCatalog.name,
						amount: effectiveAmount,
						description: mapping.addOnCatalog.description,
						taxable: true,
					},
				});
			}
		}
	}

	// Process add-ons for workspace bookings
	if (input.workspaceBookings && input.workspaceBookings.length > 0) {
		// Get workspace service
		const workspaceService = await db.service.findFirst({
			where: {
				category: "working_space",
				isActive: true,
			},
		});

		if (workspaceService) {
			for (let i = 0; i < input.workspaceBookings.length; i++) {
				const workspace = input.workspaceBookings[i];
				const createdWorkspace = booking.workspaceBookings[i];
				const addOnIds = workspace.addOnIds || [];

				if (addOnIds.length > 0) {
					// Fetch add-on mappings to get pricing information
					const mappings = await db.serviceAddOnMapping.findMany({
						where: {
							serviceId: workspaceService.id,
							addOnId: { in: addOnIds },
							isEnabled: true,
						},
						include: {
							addOnCatalog: true,
						},
					});

					// Create ServiceAddOn records for workspace
					for (const mapping of mappings) {
						const effectiveAmount = Number(
							mapping.customAmount ?? mapping.addOnCatalog.defaultAmount,
						);
						addOnTotal += effectiveAmount;

						await db.serviceAddOn.create({
							data: {
								workspaceBookingId: createdWorkspace.id,
								addOnCatalogId: mapping.addOnId,
								name: mapping.addOnCatalog.name,
								amount: effectiveAmount,
								description: mapping.addOnCatalog.description,
								taxable: true,
							},
						});
					}
				}
			}
		}
	}

	// Update total amount to include add-ons
	if (addOnTotal > 0) {
		totalAmount += addOnTotal;
		await db.bookingRequest.update({
			where: { id: booking.id },
			data: {
				totalAmount,
			},
		});
	}

	return {
		id: booking.id,
		referenceNumber: booking.referenceNumber,
		status: booking.status,
	};
}
