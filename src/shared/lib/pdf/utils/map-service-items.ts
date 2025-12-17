import type { Decimal } from "@prisma/client/runtime/library";

export interface ServiceItemInput {
	service: {
		name: string;
		code: string | null;
	};
	quantity: number;
	unitPrice: number | string | Decimal;
	totalPrice: number | string | Decimal;
	sampleName: string | null;
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
		amount: number | string | Decimal;
	}>;
}

export interface WorkspaceServiceInfo {
	name: string | null;
	code: string | null;
	unit: string;
}

export function mapServiceItemsForTOR(
	serviceItems: ServiceItemInput[],
): ServiceItemOutput[] {
	return serviceItems.map((item) => ({
		service: {
			name: item.service.name,
			code: item.service.code ?? undefined,
		},
		quantity: item.quantity,
		unitPrice:
			typeof item.unitPrice === "object" && "toNumber" in item.unitPrice
				? item.unitPrice.toNumber()
				: Number(item.unitPrice),
		totalPrice:
			typeof item.totalPrice === "object" && "toNumber" in item.totalPrice
				? item.totalPrice.toNumber()
				: Number(item.totalPrice),
		sampleName: item.sampleName ?? undefined,
	}));
}

export function mapWorkspaceBookingsForTOR(
	workspaceBookings: WorkspaceBookingInput[],
	workspaceService: WorkspaceServiceInfo,
): ServiceItemOutput[] {
	return workspaceBookings.map((workspace) => {
		const startDate = new Date(workspace.startDate);
		const endDate = new Date(workspace.endDate);
		const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // inclusive
		const months = Math.max(1, Math.ceil(diffDays / 30));

		// Use stored pricing (already includes addons in totalPrice)
		const unitPrice =
			typeof workspace.unitPrice === "object" &&
			"toNumber" in workspace.unitPrice
				? workspace.unitPrice.toNumber()
				: Number(workspace.unitPrice);
		const totalPrice =
			typeof workspace.totalPrice === "object" &&
			"toNumber" in workspace.totalPrice
				? workspace.totalPrice.toNumber()
				: Number(workspace.totalPrice);

		return {
			service: {
				name: workspaceService.name ?? "Working Space",
				code: workspaceService.code ?? "WS",
			},
			quantity: months,
			unitPrice,
			totalPrice,
			sampleName: undefined,
			unit: workspaceService.unit,
		};
	});
}
