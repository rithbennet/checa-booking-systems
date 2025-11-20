"use client";

import { useState } from "react";
import {
	OPERATIONS_TABS,
	type OperationsTab,
	OperationsTabs,
} from "@/features/operations";
import { SampleTrackerSection } from "@/features/operations/ui/SampleTrackerSection";
import { WorkspaceOverviewSection } from "@/features/operations/ui/WorkspaceOverviewSection";

export function OperationsPageClient() {
	const [activeTab, setActiveTab] = useState<OperationsTab>(
		OPERATIONS_TABS.SAMPLES,
	);

	return (
		<OperationsTabs
			activeTab={activeTab}
			onTabChange={setActiveTab}
			samplesContent={<SampleTrackerSection />}
			workspaceContent={<WorkspaceOverviewSection />}
		/>
	);
}
