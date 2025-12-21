"use client";

import { DocumentConfigSettings } from "@/features/system-settings/admin";

export default function AdminSettingsPage() {
	return (
		<div className="space-y-6 p-6">
			{/* Page Header */}
			<div>
				<h1 className="font-bold text-2xl text-slate-900">System Settings</h1>
				<p className="text-muted-foreground text-sm">
					Configure system settings and preferences. Changes to facility
					settings and signatures will affect PDF templates and service forms.
				</p>
			</div>

			{/* Settings Content */}
			<DocumentConfigSettings />
		</div>
	);
}
