"use client";

import type { UserProfileVM } from "@/entities/user/server/profile-repository";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@/shared/ui/shadcn/tabs";
import { AdminUserEditForm } from "./AdminUserEditForm";
import { UserSummaryTab } from "./UserSummaryTab";

interface AdminUserDetailsTabsProps {
	profile: UserProfileVM;
	userId: string;
}

export function AdminUserDetailsTabs({
	profile,
	userId,
}: AdminUserDetailsTabsProps) {
	return (
		<Tabs className="w-full" defaultValue="profile">
			<TabsList>
				<TabsTrigger value="profile">Profile</TabsTrigger>
				<TabsTrigger value="summary">Summary</TabsTrigger>
			</TabsList>
			<TabsContent className="mt-6" value="profile">
				<AdminUserEditForm profile={profile} userId={userId} />
			</TabsContent>
			<TabsContent className="mt-6" value="summary">
				<UserSummaryTab userId={userId} />
			</TabsContent>
		</Tabs>
	);
}
