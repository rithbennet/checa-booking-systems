"use client";

import { Loader2 } from "lucide-react";
import { useDocumentConfig } from "@/entities/document-config/api";
import { IkohzaHeadSection } from "./IkohzaHeadSection";
import { LabGeneralSection } from "./LabGeneralSection";
import { StaffPicSection } from "./StaffPicSection";

export function DocumentConfigSettings() {
	const { data: config, isLoading, error } = useDocumentConfig();

	if (isLoading) {
		return (
			<div className="flex min-h-[400px] items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-slate-400" />
			</div>
		);
	}

	if (error || !config) {
		return (
			<div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
				<p className="font-semibold">Failed to load document configuration</p>
				<p className="text-sm">
					{error instanceof Error ? error.message : "Unknown error"}
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<StaffPicSection config={config} />
			<IkohzaHeadSection config={config} />
			<LabGeneralSection config={config} />
		</div>
	);
}
