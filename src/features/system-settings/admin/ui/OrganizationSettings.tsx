"use client";

import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@/shared/ui/shadcn/tabs";
import { CompanyManagement } from "./CompanyManagement";
import { FacultyManagement } from "./FacultyManagement";

export function OrganizationSettings() {
	return (
		<div className="space-y-6">
			<div>
				<h2 className="font-medium text-lg">Organization Settings</h2>
				<p className="text-muted-foreground text-sm">
					Manage internal academic structures and external organizations.
				</p>
			</div>

			<Tabs className="w-full" defaultValue="academic">
				<TabsList>
					<TabsTrigger value="academic">Academic Structure</TabsTrigger>
					<TabsTrigger value="external">External Organizations</TabsTrigger>
				</TabsList>
				<TabsContent className="mt-4" value="academic">
					<FacultyManagement />
				</TabsContent>
				<TabsContent className="mt-4" value="external">
					<CompanyManagement />
				</TabsContent>
			</Tabs>
		</div>
	);
}
