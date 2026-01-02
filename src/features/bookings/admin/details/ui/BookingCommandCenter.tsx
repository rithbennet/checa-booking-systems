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
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@/shared/ui/shadcn/tabs";
import { BookingHeader } from "./BookingHeader";
import { FinancialGate, TimelineWidget } from "./BookingSidebar";
import { BookingStatusTimeline } from "./BookingStatusTimeline";
import { SampleDetailDrawer } from "./SampleDetailDrawer";
import { SampleModificationModal } from "./SampleModificationModal";
import { ServiceItemAccordion } from "./ServiceItemAccordion";
import { UnifiedDocumentManager } from "./UnifiedDocumentManager";
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
	const receivedDates = booking.serviceItems
		.flatMap((item) => item.sampleTracking)
		.map((sample) => sample.receivedAt)
		.filter((date): date is string => date !== null)
		.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

	// Get earliest analysis start date across all samples
	const analysisDates = booking.serviceItems
		.flatMap((item) => item.sampleTracking)
		.map((sample) => sample.analysisStartAt)
		.filter((date): date is string => date !== null)
		.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

	// For "Samples In" step: use receivedAt if available, otherwise fall back to analysisStartAt
	// This handles cases where admin sets status directly to "in_analysis" without marking as "received"
	const samplesReceivedAt = receivedDates[0] ?? analysisDates[0] ?? null;

	// For "Processing" step: use the actual analysis start date
	const processingStartedAt = analysisDates[0] ?? null;

	// Payment date from payment receipt document verification
	const paidAt = booking.paymentVerifiedAt;

	// Released date is set when booking transitions to completed
	const releasedAt = booking.releasedAt;

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

			{/* 3. Main Content Tabs */}
			<Tabs className="mt-8" defaultValue="services">
				<TabsList className="grid w-full max-w-md grid-cols-2">
					<TabsTrigger value="services">Services & Samples</TabsTrigger>
					<TabsTrigger value="documents">Documents & Finance</TabsTrigger>
				</TabsList>

				{/* Tab 1: Services & Samples */}
				<TabsContent className="mt-6" value="services">
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

							{booking.serviceItems.length === 0 &&
								booking.workspaceBookings.length === 0 && (
									<div className="flex h-40 items-center justify-center rounded-lg border border-slate-300 border-dashed bg-slate-50">
										<p className="text-slate-500">
											No services or workspaces in this booking
										</p>
									</div>
								)}
						</div>

						{/* Right Column: Timeline Widget */}
						<div className="col-span-12 xl:col-span-4">
							<TimelineWidget booking={booking} />
						</div>
					</div>
				</TabsContent>

				{/* Tab 2: Documents & Finance */}
				<TabsContent className="mt-6" value="documents">
					<div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
						{/* Left Column: Financial Gate */}
						<div className="space-y-6">
							<FinancialGate booking={booking} />
						</div>

						{/* Right Column: Documents */}
						<div className="space-y-6">
							<UnifiedDocumentManager booking={booking} />
						</div>
					</div>
				</TabsContent>
			</Tabs>

			{/* Sample Detail Drawer */}
			<SampleDetailDrawer
				bookingId={booking.id}
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
