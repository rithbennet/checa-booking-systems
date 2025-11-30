"use client";

import { Eye } from "lucide-react";
import { SampleStatusBadge } from "@/entities/sample-tracking";
import { useUserActiveSamples } from "@/entities/sample-tracking/model/queries";
import RouterButton from "@/shared/ui/router-button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/shared/ui/shadcn/card";
import { mapToWidgetItem } from "../model/mappers";

export function UserSampleTracker() {
	const { data, isLoading, isError, error } = useUserActiveSamples();

	const items = data?.items.map(mapToWidgetItem) ?? [];

	return (
		<Card>
			<CardHeader>
				<CardTitle>My Samples</CardTitle>
			</CardHeader>
			<CardContent>
				{isLoading ? (
					<div className="py-4 text-center text-muted-foreground text-sm">
						Loading samples...
					</div>
				) : isError ? (
					<div className="py-4 text-center text-destructive text-sm">
						{error instanceof Error
							? error.message
							: "Failed to load samples. Please try again later."}
					</div>
				) : items.length === 0 ? (
					<div className="py-4 text-center text-muted-foreground text-sm">
						No active samples
					</div>
				) : (
					<div className="space-y-3">
						{items.map((item) => (
							<div
								className="flex items-center justify-between rounded-lg border p-3"
								key={item.id}
							>
								<div className="flex-1 space-y-1">
									<div className="flex items-center gap-2">
										<span className="font-medium">{item.sampleIdentifier}</span>
										<SampleStatusBadge status={item.status} />
									</div>
									<div className="text-muted-foreground text-sm">
										{item.serviceName}
									</div>
								</div>
								<RouterButton
									aria-label="View booking"
									href={`/bookings/${item.bookingId}`}
									size="icon"
									title="View booking"
									variant="ghost"
								>
									<Eye className="size-4" />
								</RouterButton>
							</div>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	);
}
