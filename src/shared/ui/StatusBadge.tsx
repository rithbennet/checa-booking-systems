import type { booking_status_enum } from "generated/prisma";
import { Badge } from "./shadcn/badge";

const statusConfig: Record<
	booking_status_enum,
	{
		label: string;
		variant: "default" | "secondary" | "destructive" | "outline";
	}
> = {
	draft: { label: "Draft", variant: "outline" },
	pending_user_verification: {
		label: "Pending Verification",
		variant: "secondary",
	},
	pending_approval: { label: "Pending Approval", variant: "secondary" },
	revision_requested: { label: "Revision Requested", variant: "secondary" },
	approved: { label: "Approved", variant: "default" },
	rejected: { label: "Rejected", variant: "destructive" },
	in_progress: { label: "In Progress", variant: "default" },
	completed: { label: "Completed", variant: "default" },
	cancelled: { label: "Cancelled", variant: "outline" },
};

interface StatusBadgeProps {
	status: booking_status_enum;
	className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
	const config = statusConfig[status];

	return (
		<Badge className={className} variant={config.variant}>
			{config.label}
		</Badge>
	);
}
