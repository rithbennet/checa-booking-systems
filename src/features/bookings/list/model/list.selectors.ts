import type { BookingListItem } from "@/entities/booking/api/use-bookings-list";
import { formatAmount, formatDate } from "../lib/formatters";

export function toRow(item: BookingListItem, showAmount: boolean) {
	return {
		id: item.id,
		reference: item.reference,
		projectTitle: item.projectTitle,
		status: item.status,
		amountLabel: showAmount
			? formatAmount(item.totalAmount, item.currency)
			: "—",
		createdAtLabel: formatDate(item.createdAt),
		flags: item.flags,
		nextRequiredAction: item.nextRequiredAction,
	};
}
