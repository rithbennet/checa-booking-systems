"use client";

import { Bug } from "lucide-react";
import { usePathname } from "next/navigation";
import type { CurrentUser } from "@/shared/server/current-user";
import { SidebarMenuButton } from "@/shared/ui/shadcn/sidebar";
import { generateFeedbackUrl } from "../lib/feedback";

interface FeedbackButtonProps {
	session: CurrentUser | null;
}

export function FeedbackButton({ session }: FeedbackButtonProps) {
	const pathname = usePathname();

	const handleFeedbackClick = () => {
		if (!session) return;

		const feedbackUrl = generateFeedbackUrl({
			userEmail: session.email ?? "",
			userRole: session.role ?? "customer",
			currentPageUrl: window.location.href,
			subject: `Feedback from ${pathname}`,
		});

		window.open(feedbackUrl, "_blank", "noopener,noreferrer");
	};

	return (
		<SidebarMenuButton onClick={handleFeedbackClick} tooltip="Report Bug">
			<Bug />
			<span>Report Bug</span>
		</SidebarMenuButton>
	);
}
