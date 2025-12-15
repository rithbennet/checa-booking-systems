"use client";

import { Settings } from "lucide-react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/shared/ui/shadcn/card";

export default function AdminSettingsPage() {
	return (
		<div className="space-y-6 p-6">
			{/* Page Header */}
			<div>
				<h1 className="font-bold text-2xl text-slate-900">System Settings</h1>
				<p className="text-muted-foreground text-sm">
					Configure system settings and preferences
				</p>
			</div>

			{/* Settings Content */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Settings className="size-5" />
						Settings
					</CardTitle>
					<CardDescription>
						Manage system-wide settings and configurations
					</CardDescription>
				</CardHeader>
				<CardContent>
					<p className="text-slate-600 text-sm">
						Settings management features coming soon.
					</p>
				</CardContent>
			</Card>
		</div>
	);
}
