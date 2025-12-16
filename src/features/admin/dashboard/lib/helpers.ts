/**
 * Admin Dashboard Helpers
 * Simple formatting utilities for the dashboard
 */

export function formatCurrency(amount: number): string {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "MYR",
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(amount);
}
