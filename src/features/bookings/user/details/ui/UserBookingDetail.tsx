/**
 * UserBookingDetail Component
 *
 * Main component that orchestrates the user booking detail view.
 */

"use client";

import { useState } from "react";
import type {
	UserBookingDetailVM,
	UserSampleTrackingVM,
} from "@/entities/booking/model/user-detail-types";
import { UserBookingHeader } from "./UserBookingHeader";
import { UserBookingSidebar } from "./UserBookingSidebar";
import { UserBookingTimeline } from "./UserBookingTimeline";
import { UserDocumentsSection } from "./UserDocumentsSection";
import { UserSampleDrawer } from "./UserSampleDrawer";
import { UserServiceItemCard } from "./UserServiceItemCard";
import { UserWorkspaceCard } from "./UserWorkspaceCard";

interface UserBookingDetailProps {
	booking: UserBookingDetailVM;
}

export function UserBookingDetail({ booking }: UserBookingDetailProps) {
	// State for sample drawer
	const [selectedSample, setSelectedSample] =
		useState<UserSampleTrackingVM | null>(null);
	const [selectedSampleName, setSelectedSampleName] = useState<string>();
	const [drawerOpen, setDrawerOpen] = useState(false);

	// Handle sample click
	const handleSampleClick = (
		sample: UserSampleTrackingVM,
		sampleName?: string,
	) => {
		setSelectedSample(sample);
		setSelectedSampleName(sampleName);
		setDrawerOpen(true);
	};

	return (
		<div className="mx-auto max-w-[1400px] px-4 py-6">
			{/* Header with reference, status, and actions */}
			<UserBookingHeader booking={booking} />

			{/* Progress Timeline */}
			<UserBookingTimeline booking={booking} />

			{/* Documents Section */}
			<UserDocumentsSection booking={booking} />

			{/* Main Content Grid */}
			<div className="grid grid-cols-12 gap-6">
				{/* Left Column: Services & Workspaces */}
				<div className="col-span-12 space-y-4 xl:col-span-8">
					{/* Service Items */}
					{booking.serviceItems.map((item) => (
						<UserServiceItemCard
							canDownloadResults={booking.canDownloadResults}
							key={item.id}
							onSampleClick={(sample) =>
								handleSampleClick(sample, item.sampleName ?? undefined)
							}
							serviceItem={item}
						/>
					))}

					{/* Workspace Bookings */}
					{booking.workspaceBookings.map((workspace) => (
						<UserWorkspaceCard key={workspace.id} workspace={workspace} />
					))}

					{/* Empty state */}
					{booking.serviceItems.length === 0 &&
						booking.workspaceBookings.length === 0 && (
							<div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
								<p className="text-slate-500">
									No services or workspace bookings in this request.
								</p>
							</div>
						)}
				</div>

				{/* Right Column: Sidebar */}
				<div className="col-span-12 xl:col-span-4">
					<UserBookingSidebar booking={booking} />
				</div>
			</div>

			{/* Sample Detail Drawer */}
			<UserSampleDrawer
				canDownload={booking.canDownloadResults}
				onOpenChange={setDrawerOpen}
				open={drawerOpen}
				sample={selectedSample}
				sampleName={selectedSampleName}
			/>
		</div>
	);
}
