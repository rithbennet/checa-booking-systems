"use client";

import {
	AlertCircle,
	CheckCircle2,
	Clock,
	MinusCircle,
	Upload,
} from "lucide-react";
import type { DocumentVerificationStatus } from "@/entities/booking-document";
import {
	getVerificationStatusLabel,
	verificationStatusColors,
} from "@/entities/booking-document";
import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/shadcn/badge";

interface VerificationStatusBadgeProps {
	status: DocumentVerificationStatus;
	className?: string;
}

const statusIcons: Record<DocumentVerificationStatus, React.ReactNode> = {
	pending_upload: <Upload className="h-3 w-3" />,
	pending_verification: <Clock className="h-3 w-3" />,
	verified: <CheckCircle2 className="h-3 w-3" />,
	rejected: <AlertCircle className="h-3 w-3" />,
	not_required: <MinusCircle className="h-3 w-3" />,
};

export function VerificationStatusBadge({
	status,
	className,
}: VerificationStatusBadgeProps) {
	const colors = verificationStatusColors[status];
	const label = getVerificationStatusLabel(status);
	const icon = statusIcons[status];

	return (
		<Badge
			className={cn(
				"gap-1.5 font-medium",
				colors.bg,
				colors.text,
				colors.border,
				className,
			)}
			variant="outline"
		>
			{icon}
			{label}
		</Badge>
	);
}
