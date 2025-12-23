"use client";

import {
	DocumentConfigSettings,
	OrganizationSettings,
} from "@/features/system-settings/admin";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@/shared/ui/shadcn/tabs";

export default function AdminSettingsPage() {
	return (
		<div className="space-y-6 p-6">
			{/* Page Header */}
			<div>
				<h1 className="font-bold text-2xl text-slate-900">System Settings</h1>
				<p className="text-muted-foreground text-sm">
					Configure system settings and preferences.
				</p>
			</div>

			<Tabs className="w-full" defaultValue="documents">
				<TabsList>
					<TabsTrigger value="documents">Documents & General</TabsTrigger>
					<TabsTrigger value="organizations">Organizations</TabsTrigger>
				</TabsList>
				<TabsContent className="mt-6" value="documents">
					<DocumentConfigSettings />
				</TabsContent>
				<TabsContent className="mt-6" value="organizations">
					<OrganizationSettings />
				</TabsContent>
			</Tabs>
		</div>
	);
}
