"use client";

import type { UserType } from "@/entities/user/model/types";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/shared/ui/shadcn/select";

interface UserTypeFilterProps {
	value: UserType | "all";
	onChange: (value: UserType | "all") => void;
}

const USER_TYPE_OPTIONS: Array<{ value: UserType | "all"; label: string }> = [
	{ value: "all", label: "All Types" },
	{ value: "mjiit_member", label: "MJIIT Members" },
	{ value: "utm_member", label: "UTM Members" },
	{ value: "external_member", label: "External Users" },
	{ value: "lab_administrator", label: "Administrators" },
];

export function UserTypeFilter({ value, onChange }: UserTypeFilterProps) {
	return (
		<div className="flex items-center gap-3">
			<span className="font-medium text-muted-foreground text-sm">Type:</span>
			<Select onValueChange={onChange} value={value}>
				<SelectTrigger className="w-[180px]">
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					{USER_TYPE_OPTIONS.map((option) => (
						<SelectItem key={option.value} value={option.value}>
							{option.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
}
