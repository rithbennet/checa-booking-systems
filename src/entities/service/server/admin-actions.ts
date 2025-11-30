/**
 * Admin Service Actions
 *
 * Server actions for service management (upsert, toggle)
 */

"use server";

import { db } from "@/shared/server/db";
import {
	type ServiceUpsertInput,
	serviceUpsertInputSchema,
} from "../model/admin-types";

/**
 * Upsert a service with its pricing and add-on mappings
 *
 * @param input - Service data including pricing and add-ons
 * @returns The created/updated service ID
 */
export async function upsertAdminService(
	input: ServiceUpsertInput,
): Promise<{ id: string }> {
	// Validate input
	const parsed = serviceUpsertInputSchema.parse(input);

	const {
		id,
		code,
		name,
		description,
		category,
		isActive,
		requiresSample,
		minSampleMass,
		operatingHours,
		pricing,
		addOns,
	} = parsed;

	return await db.$transaction(async (tx) => {
		// Create or update the service
		let serviceId: string;

		if (id) {
			// Update existing service
			const updated = await tx.service.update({
				where: { id },
				data: {
					code,
					name,
					description,
					category,
					isActive,
					requiresSample,
					minSampleMass,
					operatingHours,
				},
			});
			serviceId = updated.id;
		} else {
			// Create new service
			const created = await tx.service.create({
				data: {
					code,
					name,
					description,
					category,
					isActive,
					requiresSample,
					minSampleMass,
					operatingHours,
				},
			});
			serviceId = created.id;
		}

		// Delete existing pricing (for current period) and recreate
		// We expire old pricing instead of deleting for audit trail
		await tx.servicePricing.updateMany({
			where: {
				serviceId,
				effectiveTo: null,
			},
			data: {
				effectiveTo: new Date(),
			},
		});

		// Create new pricing entries
		if (pricing && pricing.length > 0) {
			await tx.servicePricing.createMany({
				data: pricing.map((p) => ({
					serviceId,
					userType: p.userType,
					price: p.price,
					unit: p.unit,
					effectiveFrom: new Date(),
					effectiveTo: null,
				})),
			});
		}

		// Handle add-on mappings
		if (addOns) {
			// Delete all existing mappings for this service
			await tx.serviceAddOnMapping.deleteMany({
				where: { serviceId },
			});

			// Create new mappings for enabled add-ons
			const enabledAddOns = addOns.filter((a) => a.isEnabled);
			if (enabledAddOns.length > 0) {
				await tx.serviceAddOnMapping.createMany({
					data: enabledAddOns.map((a) => ({
						serviceId,
						addOnId: a.addOnId,
						isEnabled: true,
						customAmount: a.customAmount ?? null,
					})),
				});
			}
		}

		return { id: serviceId };
	});
}

/**
 * Toggle service active status
 *
 * @param id - Service ID
 * @param isActive - New active status
 */
export async function toggleServiceActive(
	id: string,
	isActive: boolean,
): Promise<{ id: string; isActive: boolean }> {
	const updated = await db.service.update({
		where: { id },
		data: { isActive },
		select: { id: true, isActive: true },
	});

	return updated;
}
