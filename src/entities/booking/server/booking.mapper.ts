import { Decimal } from "@prisma/client/runtime/library";
import type { BookingSaveDraftDto, BookingSubmitDto } from "./booking.dto";

/**
 * Service pricing data structure (fetched from ServicePricing table)
 */
export interface ServicePricingData {
	serviceId: string;
	userType: string;
	price: Decimal;
	unit: string;
}

/**
 * Normalized booking service item for DB storage
 */
export interface NormalizedServiceItem {
	id?: string; // Present for updates, absent for creates
	serviceId: string;
	quantity: number;
	unitPrice: Decimal;
	totalPrice: Decimal;
	sampleName?: string;
	sampleDetails?: string;
	sampleType?: string;
	sampleHazard?: string;
	testingMethod?: string;
	degasConditions?: string;
	solventSystem?: string;
	solvents?: string;
	solventComposition?: string;
	columnType?: string;
	flowRate?: Decimal;
	wavelength?: number;
	expectedRetentionTime?: Decimal;
	samplePreparation?: string;
	notes?: string;
	expectedCompletionDate?: Date;
	actualCompletionDate?: Date;
	turnaroundEstimate?: string;
	temperatureControlled: boolean;
	lightSensitive: boolean;
	hazardousMaterial: boolean;
	inertAtmosphere: boolean;
	equipmentIds: string[];
	otherEquipmentRequests?: string[];
	addOnCatalogIds?: string[];
}

/**
 * Normalized workspace booking for DB storage
 */
export interface NormalizedWorkspaceBooking {
	id?: string;
	startDate: Date;
	endDate: Date;
	preferredTimeSlot?: string;
	unitPrice: Decimal; // Monthly rate
	totalPrice: Decimal; // Base price + addons
	equipmentIds: string[];
	specialEquipment?: string[];
	purpose?: string;
	notes?: string;
	addOnCatalogIds?: string[];
}

/**
 * Add-on data for calculations
 */
export interface AddOnData {
	id: string;
	name: string;
	amount: Decimal;
}

/**
 * Result of mapping DTO to normalized structures
 */
export interface MappingResult {
	serviceItems: NormalizedServiceItem[];
	workspaceBookings: NormalizedWorkspaceBooking[];
	totalAmount: Decimal;
}

/**
 * Maps DTO input to normalized DB structures with computed prices
 * @param input - The booking DTO (draft or submit)
 * @param pricingMap - Map of serviceId to pricing data
 * @param addOnsMap - Map of addOnId to add-on data
 * @param userType - User type for pricing lookup
 * @returns Normalized structures ready for DB insertion
 */
export function mapDtoToNormalized(
	input: BookingSaveDraftDto | BookingSubmitDto,
	pricingMap: Map<string, ServicePricingData>,
	addOnsMap: Map<string, AddOnData>,
	userType: string,
	workspaceMonthlyRate?: Decimal,
	serviceAddOnAmountMap?: Map<string, Decimal>,
): MappingResult {
	const serviceItems: NormalizedServiceItem[] = [];
	const workspaceBookings: NormalizedWorkspaceBooking[] = [];

	// Map service items
	if (input.serviceItems && Array.isArray(input.serviceItems)) {
		for (const item of input.serviceItems) {
			const pricing = pricingMap.get(item.serviceId);
			if (!pricing) {
				throw new Error(
					`Pricing not found for service ${item.serviceId} and user type ${userType}`,
				);
			}

			const quantity = item.quantity ?? 0;

			// Calculate base price
			// For analysis: quantity * unitPrice

			const basePrice = pricing.price.mul(quantity);

			// Add add-ons to the price
			let addOnsTotal = new Decimal(0);
			if (item.addOnCatalogIds && Array.isArray(item.addOnCatalogIds)) {
				for (const addOnId of item.addOnCatalogIds) {
					const resolvedAmount =
						serviceAddOnAmountMap?.get(`${item.serviceId}:${addOnId}`) ??
						addOnsMap.get(addOnId)?.amount;
					if (resolvedAmount) {
						// Per-sample addons: charge addon unit amount per sample
						addOnsTotal = addOnsTotal.add(resolvedAmount.mul(quantity));
					}
				}
			}

			const totalPrice = basePrice.add(addOnsTotal);

			serviceItems.push({
				id: (item as { id?: string }).id,
				serviceId: item.serviceId,
				quantity,
				unitPrice: pricing.price,
				totalPrice,
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
				flowRate: item.flowRate ? new Decimal(item.flowRate) : undefined,
				wavelength: item.wavelength,
				expectedRetentionTime: item.expectedRetentionTime
					? new Decimal(item.expectedRetentionTime)
					: undefined,
				samplePreparation: item.samplePreparation,
				notes: item.notes,
				expectedCompletionDate: item.expectedCompletionDate,
				actualCompletionDate: item.actualCompletionDate,
				turnaroundEstimate: item.turnaroundEstimate,
				temperatureControlled: item.temperatureControlled ?? false,
				lightSensitive: item.lightSensitive ?? false,
				hazardousMaterial: item.hazardousMaterial ?? false,
				inertAtmosphere: item.inertAtmosphere ?? false,
				equipmentIds: item.equipmentIds ?? [],
				otherEquipmentRequests: item.otherEquipmentRequests,
				addOnCatalogIds: item.addOnCatalogIds,
			});
		}
	}

	// Map workspace bookings
	if (input.workspaceBookings && Array.isArray(input.workspaceBookings)) {
		for (const workspace of input.workspaceBookings) {
			const startDate =
				workspace.startDate instanceof Date
					? workspace.startDate
					: new Date(workspace.startDate);
			const endDate =
				workspace.endDate instanceof Date
					? workspace.endDate
					: new Date(workspace.endDate);

			// Calculate base price (monthly rate × months)
			let basePrice = new Decimal(0);
			if (workspaceMonthlyRate) {
				const ms = endDate.getTime() - startDate.getTime();
				const days = Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)) + 1); // inclusive
				const months = Math.max(1, Math.ceil(days / 30));
				basePrice = workspaceMonthlyRate.mul(months);
			}

			// Calculate addons total
			let addOnsTotal = new Decimal(0);
			if (
				workspace.addOnCatalogIds &&
				Array.isArray(workspace.addOnCatalogIds)
			) {
				for (const addOnId of workspace.addOnCatalogIds) {
					const addOn = addOnsMap.get(addOnId);
					if (addOn) {
						addOnsTotal = addOnsTotal.add(addOn.amount);
					}
				}
			}

			const totalPrice = basePrice.add(addOnsTotal);

			workspaceBookings.push({
				id: (workspace as { id?: string }).id,
				startDate,
				endDate,
				preferredTimeSlot: workspace.preferredTimeSlot,
				unitPrice: workspaceMonthlyRate ?? new Decimal(0),
				totalPrice,
				equipmentIds: workspace.equipmentIds ?? [],
				specialEquipment: workspace.specialEquipment,
				purpose: workspace.purpose,
				notes: workspace.notes,
				addOnCatalogIds: workspace.addOnCatalogIds,
			});
		}
	}

	const totalAmount = computeTotals(
		serviceItems,
		workspaceBookings,
		addOnsMap,
		workspaceMonthlyRate,
	);

	return {
		serviceItems,
		workspaceBookings,
		totalAmount,
	};
}

/**
 * Computes total amount from service items and workspace bookings
 * @param serviceItems - Normalized service items with totalPrice computed
 * @param workspaceBookings - Normalized workspace bookings with totalPrice computed
 * @param addOnsMap - Map of add-on IDs to add-on data (unused now, kept for compatibility)
 * @param workspaceMonthlyRate - Monthly rate (unused now, kept for compatibility)
 * @returns Total amount for the booking
 */
export function computeTotals(
	serviceItems: NormalizedServiceItem[],
	workspaceBookings: NormalizedWorkspaceBooking[],
	_addOnsMap: Map<string, AddOnData>,
	_workspaceMonthlyRate?: Decimal,
): Decimal {
	let total = new Decimal(0);

	// Sum service items
	for (const item of serviceItems) {
		total = total.add(item.totalPrice);
	}

	// Sum workspace bookings (totalPrice already includes base price + addons)
	for (const workspace of workspaceBookings) {
		total = total.add(workspace.totalPrice);
	}

	return total;
}

/**
 * Helper to convert Prisma Decimal to number for JSON serialization
 */
export function decimalToNumber(decimal: Decimal | null | undefined): number {
	if (!decimal) return 0;
	return decimal.toNumber();
}

/**
 * Helper to convert number to Prisma Decimal
 */
export function numberToDecimal(value: number | null | undefined): Decimal {
	if (value == null) return new Decimal(0);
	return new Decimal(value);
}
