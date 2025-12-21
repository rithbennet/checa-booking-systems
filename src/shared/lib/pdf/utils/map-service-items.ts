import type { Decimal } from "@prisma/client/runtime/library";

export interface ServiceItemInput {
	serviceId: string;
	service: {
		name: string;
		code: string | null;
	};
	quantity: number;
	unitPrice: number | string | Decimal;
	totalPrice: number | string | Decimal;
	sampleName: string | null;
	serviceAddOns?: Array<{
		id: string;
		name: string;
		amount: number | string | Decimal;
		description?: string | null;
		quantity?: number | null;
	}>;
}

export interface ServiceItemOutput {
	service: {
		name: string;
		code?: string;
	};
	quantity: number;
	unitPrice: number;
	totalPrice: number;
	sampleName?: string;
	unit?: string;
}

export interface WorkspaceBookingInput {
	startDate: Date | string;
	endDate: Date | string;
	unitPrice: number | string | Decimal;
	totalPrice: number | string | Decimal;
	serviceAddOns?: Array<{
		id: string;
		name: string;
		amount: number | string | Decimal;
		description?: string | null;
	}>;
}

export interface WorkspaceServiceInfo {
	name: string | null;
	code: string | null;
	unit: string;
}

export function mapServiceItemsForTOR(
	serviceItems: ServiceItemInput[],
	unitMap?: Map<string, string>,
): ServiceItemOutput[] {
	return serviceItems.flatMap((item) => {
		const unit = unitMap?.get(item.serviceId) ?? "samples";

		const baseUnitPrice =
			typeof item.unitPrice === "object" && "toNumber" in item.unitPrice
				? item.unitPrice.toNumber()
				: Number(item.unitPrice);

		const baseLine: ServiceItemOutput = {
			service: {
				name: item.service.name,
				code: item.service.code ?? undefined,
			},
			quantity: item.quantity,
			unitPrice: baseUnitPrice,
			totalPrice:
				typeof item.totalPrice === "object" && "toNumber" in item.totalPrice
					? item.totalPrice.toNumber()
					: Number(item.totalPrice),
			sampleName: item.sampleName ?? undefined,
			unit,
		};

		const addOnLines: ServiceItemOutput[] = [];
		if (item.serviceAddOns && item.serviceAddOns.length > 0) {
			for (const addon of item.serviceAddOns) {
				const addonAmount =
					typeof addon.amount === "object" && "toNumber" in addon.amount
						? addon.amount.toNumber()
						: Number(addon.amount);

				// Prefer stored add-on quantity snapshot when available; fallback to service item quantity
				const addonQty =
					addon.quantity != null
						? Number(addon.quantity)
						: Number(item.quantity);

				addOnLines.push({
					service: {
						name: addon.name,
						code: undefined,
					},
					quantity: addonQty,
					unitPrice: addonAmount,
					totalPrice: addonAmount * addonQty,
					sampleName: item.sampleName ?? undefined,
					unit,
				});
			}
		}

		return [baseLine, ...addOnLines];
	});
}

export function mapWorkspaceBookingsForTOR(
	workspaceBookings: WorkspaceBookingInput[],
	workspaceService: WorkspaceServiceInfo,
): ServiceItemOutput[] {
	return workspaceBookings.flatMap((workspace) => {
		const startDate = new Date(workspace.startDate);
		const endDate = new Date(workspace.endDate);
		const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // inclusive
		const months = Math.max(1, Math.ceil((diffDays - 1) / 30));

		// Calculate base workspace price (without addons)
		const unitPrice =
			typeof workspace.unitPrice === "object" &&
			"toNumber" in workspace.unitPrice
				? workspace.unitPrice.toNumber()
				: Number(workspace.unitPrice);

		// Use provided totalPrice if available (handles prorated/adjusted pricing),
		// otherwise calculate from unitPrice * months
		const storedTotalPrice =
			typeof workspace.totalPrice === "object" &&
			"toNumber" in workspace.totalPrice
				? workspace.totalPrice.toNumber()
				: workspace.totalPrice != null
					? Number(workspace.totalPrice)
					: null;
		const calculatedBasePrice = unitPrice * months;
		const basePrice = storedTotalPrice ?? calculatedBasePrice;

		// Base workspace item
		const items: ServiceItemOutput[] = [
			{
				service: {
					name: workspaceService.name ?? "Working Space",
					code: workspaceService.code ?? "WS",
				},
				quantity: months,
				unitPrice,
				totalPrice: basePrice,
				sampleName: undefined,
				unit: "months", // Workarea is always billed in months
			},
		];

		// Add each addon as a separate line item
		if (workspace.serviceAddOns && workspace.serviceAddOns.length > 0) {
			for (const addon of workspace.serviceAddOns) {
				const addonAmount =
					typeof addon.amount === "object" && "toNumber" in addon.amount
						? addon.amount.toNumber()
						: Number(addon.amount);

				items.push({
					service: {
						name: addon.name,
						code: undefined,
					},
					quantity: 1,
					unitPrice: addonAmount,
					totalPrice: addonAmount,
					sampleName: undefined,
					unit: undefined,
				});
			}
		}

		return items;
	});
}
