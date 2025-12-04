/**
 * UserBookingDetail Component
 *
 * Main component that orchestrates the user booking detail view.
 */

"use client";

import { useMemo, useState } from "react";
import type {
	UserBookingDetailVM,
	UserSampleTrackingVM,
	UserServiceItemVM,
} from "@/entities/booking/model/user-detail-types";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@/shared/ui/shadcn/tabs";
import {
	extractPrefetchableUrls,
	usePrefetchFiles,
} from "../lib/usePrefetchFiles";
import { ModificationAlert } from "./ModificationAlert";
import { UserBookingHeader } from "./UserBookingHeader";
import { UserBookingOverview } from "./UserBookingOverview";
import { UserBookingSidebar } from "./UserBookingSidebar";
import { UserDocumentsSection } from "./UserDocumentsSection";
import { UserModificationModal } from "./UserModificationModal";
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

	// State for modification modal
	const [modificationModalOpen, setModificationModalOpen] = useState(false);
	const [selectedServiceItem, setSelectedServiceItem] =
		useState<UserServiceItemVM | null>(null);

	// Prefetch all file URLs in the background for faster viewing
	const prefetchableFiles = useMemo(
		() => extractPrefetchableUrls(booking),
		[booking],
	);
	usePrefetchFiles(prefetchableFiles);

	// Check if user can request modifications (approved or in_progress status)
	const canRequestModification =
		booking.status === "approved" || booking.status === "in_progress";

	// Handle sample click
	const handleSampleClick = (
		sample: UserSampleTrackingVM,
		sampleName?: string,
	) => {
		setSelectedSample(sample);
		setSelectedSampleName(sampleName);
		setDrawerOpen(true);
	};

	// Handle modification request
	const handleRequestModification = (serviceItem: UserServiceItemVM) => {
		setSelectedServiceItem(serviceItem);
		setModificationModalOpen(true);
	};

	const [activeTab, setActiveTab] = useState("overview");

	return (
		<div className="mx-auto max-w-[1400px] space-y-6 px-4 py-6">
			{/* Header with reference, status, and actions */}
			<UserBookingHeader booking={booking} />

			{/* Modification Alerts - show if there are pending admin modifications */}
			{booking.pendingModifications?.some(
				(m) => m.status === "pending" && m.initiatedByAdmin,
			) && (
				<div className="mb-6">
					<ModificationAlert
						bookingId={booking.id}
						modifications={booking.pendingModifications}
					/>
				</div>
			)}

			<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
				{/* Main Content Area */}
				<div className="lg:col-span-2">
					<Tabs
						className="w-full"
						onValueChange={setActiveTab}
						value={activeTab}
					>
						<TabsList className="grid w-full grid-cols-3">
							<TabsTrigger value="overview">Overview</TabsTrigger>
							<TabsTrigger value="services">Services & Samples</TabsTrigger>
							<TabsTrigger value="documents">Documents</TabsTrigger>
						</TabsList>

						<TabsContent className="mt-6 space-y-6" value="overview">
							<UserBookingOverview
								booking={booking}
								onTabChange={setActiveTab}
							/>
						</TabsContent>

						<TabsContent className="mt-6 space-y-6" value="services">
							{/* Service Items */}
							{booking.serviceItems.map((item) => (
								<UserServiceItemCard
									canDownloadResults={booking.canDownloadResults}
									canRequestModification={canRequestModification}
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
						</TabsContent>

						<TabsContent className="mt-6 space-y-6" value="documents">
							<UserDocumentsSection booking={booking} />
						</TabsContent>
					</Tabs>
				</div>

				{/* Sidebar */}
				<div className="space-y-6">
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

			{/* Modification Request Modal */}
			<UserModificationModal
				bookingId={booking.id}
				onOpenChange={setModificationModalOpen}
				open={modificationModalOpen}
				serviceItem={selectedServiceItem}
			/>
		</div>
	);
}
