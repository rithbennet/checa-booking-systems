/**
 * BookingCommandCenter Component
 *
 * Main client component that orchestrates all booking command center UI elements.
 * Manages state for sample drawer and coordinates between components.
 */

"use client";

import { useState } from "react";
import type {
	BookingCommandCenterVM,
	SampleTrackingVM,
	ServiceItemVM,
} from "@/entities/booking/model/command-center-types";
import { BookingHeader } from "./BookingHeader";
import { BookingSidebar } from "./BookingSidebar";
import { BookingStatusTimeline } from "./BookingStatusTimeline";
import { SampleDetailDrawer } from "./SampleDetailDrawer";
import { SampleModificationModal } from "./SampleModificationModal";
import { ServiceItemAccordion } from "./ServiceItemAccordion";
import { WorkspaceAccordion } from "./WorkspaceAccordion";

interface BookingCommandCenterProps {
	booking: BookingCommandCenterVM;
}

export function BookingCommandCenter({ booking }: BookingCommandCenterProps) {
	// State for sample drawer
	const [selectedSample, setSelectedSample] = useState<SampleTrackingVM | null>(
		null,
	);
	const [selectedSampleName, setSelectedSampleName] = useState<string>();
	const [drawerOpen, setDrawerOpen] = useState(false);

	// State for modification modal
	const [modificationModalOpen, setModificationModalOpen] = useState(false);
	const [selectedServiceItem, setSelectedServiceItem] =
		useState<ServiceItemVM | null>(null);

	// Handle sample click from accordions
	const handleSampleClick = (sample: SampleTrackingVM, sampleName?: string) => {
		setSelectedSample(sample);
		setSelectedSampleName(sampleName);
		setDrawerOpen(true);
	};

	// Handle modification request from accordions
	const handleRequestModification = (serviceItem: ServiceItemVM) => {
		setSelectedServiceItem(serviceItem);
		setModificationModalOpen(true);
	};

	// Calculate estimated days for timeline (based on first service item's turnaround)
	const estimatedDays = booking.serviceItems[0]?.turnaroundEstimate
		? Number.parseInt(booking.serviceItems[0].turnaroundEstimate, 10)
		: 4;

	// Get earliest sample received date across all service items
	const samplesReceivedAt =
		booking.serviceItems
			.flatMap((item) => item.sampleTracking)
			.map((sample) => sample.receivedAt)
			.filter((date): date is string => date !== null)
			.sort((a, b) => new Date(a).getTime() - new Date(b).getTime())[0] ?? null;

	// Get earliest analysis start date across all samples
	const processingStartedAt =
		booking.serviceItems
			.flatMap((item) => item.sampleTracking)
			.map((sample) => sample.analysisStartAt)
			.filter((date): date is string => date !== null)
			.sort((a, b) => new Date(a).getTime() - new Date(b).getTime())[0] ?? null;

	// Get first verified payment date
	const paidAt =
		booking.serviceForms
			.flatMap((form) => form.invoices)
			.flatMap((invoice) => invoice.payments)
			.filter((payment) => payment.status === "verified" && payment.verifiedAt)
			.map((payment) => payment.verifiedAt)
			.filter((date): date is string => date !== null)
			.sort((a, b) => new Date(a).getTime() - new Date(b).getTime())[0] ?? null;

	// Released date is when booking is completed
	const releasedAt = booking.status === "completed" ? booking.updatedAt : null;

	return (
		<div className="mx-auto max-w-[1600px] p-4 pb-24 md:p-6">
			{/* 1. Customer Header & Global Actions */}
			<BookingHeader booking={booking} />

			{/* 2. Status Timeline */}
			<BookingStatusTimeline
				dates={{
					verifiedAt: booking.reviewedAt,
					samplesReceivedAt,
					processingStartedAt,
					paidAt,
					releasedAt,
				}}
				estimatedDays={estimatedDays}
				status={booking.status}
			/>

			{/* Main Content Grid */}
			<div className="grid grid-cols-12 gap-8">
				{/* Left Column: Services & Workspaces */}
				<div className="col-span-12 space-y-6 xl:col-span-8">
					{/* Service Items */}
					{booking.serviceItems.map((item) => (
						<ServiceItemAccordion
							key={item.id}
							onRequestModification={handleRequestModification}
							onSampleClick={(sample) =>
								handleSampleClick(sample, item.sampleName ?? undefined)
							}
							serviceItem={item}
						/>
					))}

					{/* Workspace Bookings */}
					{booking.workspaceBookings.map((workspace) => (
						<WorkspaceAccordion key={workspace.id} workspace={workspace} />
					))}
				</div>

				{/* Right Column: Sidebar */}
				<div className="col-span-12 xl:col-span-4">
					<BookingSidebar booking={booking} />
				</div>
			</div>

			{/* Sample Detail Drawer */}
			<SampleDetailDrawer
				onOpenChange={setDrawerOpen}
				open={drawerOpen}
				sample={selectedSample}
				sampleName={selectedSampleName}
			/>

			{/* Sample Modification Modal */}
			{selectedServiceItem && (
				<SampleModificationModal
					onOpenChange={setModificationModalOpen}
					open={modificationModalOpen}
					serviceItem={selectedServiceItem}
				/>
			)}
		</div>
	);
}
