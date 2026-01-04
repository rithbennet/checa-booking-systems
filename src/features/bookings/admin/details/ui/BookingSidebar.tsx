/**
 * BookingSidebar Component
 *
 * Right sidebar for the booking command center containing:
 * - Timeline Widget (target completion, urgent flag)
 * - Document Vault (client uploads, admin docs)
 * - Financial Gate (payment status, verification)
 */

"use client";

import type { BookingCommandCenterVM } from "@/entities/booking/model/command-center-types";
import { DocumentVerificationPanel } from "@/entities/booking-document";
import { DocumentVault } from "./DocumentVault";
import { FinancialGate } from "./FinancialGate";
import { TimelineWidget } from "./TimelineWidget";

interface BookingSidebarProps {
	booking: BookingCommandCenterVM;
}

export function BookingSidebar({ booking }: BookingSidebarProps) {
	return (
		<div className="space-y-6">
			<TimelineWidget booking={booking} />
			<DocumentVault booking={booking} />
			<DocumentVerificationPanel
				bookingId={booking.id}
				bookingReference={booking.referenceNumber}
			/>
			<FinancialGate booking={booking} />
		</div>
	);
}
