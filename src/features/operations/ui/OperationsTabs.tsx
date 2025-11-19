"use client";

import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@/shared/ui/shadcn/tabs";
import {
	OPERATIONS_TAB_LABELS,
	OPERATIONS_TABS,
	type OperationsTab,
} from "../model/constants";

interface OperationsTabsProps {
	activeTab: OperationsTab;
	onTabChange: (tab: OperationsTab) => void;
	samplesContent: React.ReactNode;
	workspaceContent: React.ReactNode;
}

export function OperationsTabs({
	activeTab,
	onTabChange,
	samplesContent,
	workspaceContent,
}: OperationsTabsProps) {
	return (
		<Tabs
			onValueChange={(v) => onTabChange(v as OperationsTab)}
			value={activeTab}
		>
			<TabsList>
				<TabsTrigger value={OPERATIONS_TABS.SAMPLES}>
					{OPERATIONS_TAB_LABELS[OPERATIONS_TABS.SAMPLES]}
				</TabsTrigger>
				<TabsTrigger value={OPERATIONS_TABS.WORKSPACE}>
					{OPERATIONS_TAB_LABELS[OPERATIONS_TABS.WORKSPACE]}
				</TabsTrigger>
			</TabsList>
			<TabsContent className="mt-6" value={OPERATIONS_TABS.SAMPLES}>
				{samplesContent}
			</TabsContent>
			<TabsContent className="mt-6" value={OPERATIONS_TABS.WORKSPACE}>
				{workspaceContent}
			</TabsContent>
		</Tabs>
	);
}
