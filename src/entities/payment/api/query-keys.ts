/**
 * Payment query keys for TanStack Query
 */

import type { PaymentListFilters } from "../model/types";

export const paymentKeys = {
	all: ["payments"] as const,
	pending: (params?: Partial<PaymentListFilters>) =>
		[...paymentKeys.all, "pending", params ?? {}] as const,
	history: (params?: Partial<PaymentListFilters>) =>
		[...paymentKeys.all, "history", params ?? {}] as const,
	detail: (id: string) => [...paymentKeys.all, "detail", id] as const,
};
