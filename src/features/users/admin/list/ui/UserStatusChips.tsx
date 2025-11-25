"use client";

import type { UserStatus, UserStatusCounts } from "@/entities/user/model/types";
import { Badge } from "@/shared/ui/shadcn/badge";

interface UserStatusChipsProps {
	counts?: UserStatusCounts;
	active: UserStatus | undefined;
	onChange: (status: UserStatus | undefined) => void;
}

const STATUS_CONFIG: Array<{
	value: UserStatus | undefined;
	label: string;
	activeClass: string;
}> = [
	{
		value: undefined,
		label: "All",
		activeClass: "bg-slate-100 text-slate-800 ring-2 ring-slate-500",
	},
	{
		value: "pending",
		label: "Pending",
		activeClass: "bg-yellow-100 text-yellow-800 ring-2 ring-yellow-500",
	},
	{
		value: "active",
		label: "Active",
		activeClass: "bg-green-100 text-green-800 ring-2 ring-green-500",
	},
	{
		value: "inactive",
		label: "Inactive",
		activeClass: "bg-gray-100 text-gray-800 ring-2 ring-gray-500",
	},
	{
		value: "rejected",
		label: "Rejected",
		activeClass: "bg-red-100 text-red-800 ring-2 ring-red-500",
	},
	{
		value: "suspended",
		label: "Suspended",
		activeClass: "bg-orange-100 text-orange-800 ring-2 ring-orange-500",
	},
];

export function UserStatusChips({
	counts,
	active,
	onChange,
}: UserStatusChipsProps) {
	const getCount = (status: UserStatus | undefined): number | undefined => {
		if (!counts) return undefined;
		if (status === undefined) return counts.all;
		return counts[status];
	};

	return (
		<div className="flex flex-wrap items-center gap-2">
			{STATUS_CONFIG.map((config) => {
				const isActive = active === config.value;
				const count = getCount(config.value);

				return (
					<Badge
						className={`cursor-pointer rounded-full transition-all ${
							isActive
								? config.activeClass
								: "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
						}`}
						key={config.value ?? "all"}
						onClick={() => onChange(config.value)}
						variant="secondary"
					>
						{config.label}
						{count !== undefined && ` (${count})`}
					</Badge>
				);
			})}
		</div>
	);
}
