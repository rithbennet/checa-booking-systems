import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserProfile } from "@/entities/user/server/profile-repository";
import { AdminUserEditForm } from "@/features/users/admin/details/ui/AdminUserEditForm";
import { Badge } from "@/shared/ui/shadcn/badge";
import { Button } from "@/shared/ui/shadcn/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/shared/ui/shadcn/card";
import { Separator } from "@/shared/ui/shadcn/separator";

function formatDate(dateString: string | null): string {
	if (!dateString) return "Never";
	return new Date(dateString).toLocaleDateString("en-US", {
		year: "numeric",
		month: "long",
		day: "numeric",
	});
}

function formatUserType(userType: string): string {
	const types: Record<string, string> = {
		mjiit_member: "MJIIT Member",
		utm_member: "UTM Member",
		external_member: "External Member",
		lab_administrator: "Lab Administrator",
	};
	return types[userType] || userType;
}

function formatAcademicType(academicType: string): string {
	const types: Record<string, string> = {
		student: "Student",
		staff: "Staff",
		none: "N/A",
	};
	return types[academicType] || academicType;
}

function getStatusBadgeVariant(
	status: string,
): "default" | "secondary" | "destructive" | "outline" {
	switch (status) {
		case "active":
			return "default";
		case "pending":
			return "secondary";
		case "suspended":
		case "rejected":
			return "destructive";
		default:
			return "outline";
	}
}

interface AdminUserDetailsPageProps {
	params: Promise<{ userId: string }>;
}

export default async function AdminUserDetailsPage({
	params,
}: AdminUserDetailsPageProps) {
	const { userId } = await params;
	const profile = await getUserProfile(userId);

	if (!profile) {
		redirect("/admin/users");
	}

	return (
		<div className="container mx-auto px-4 py-8">
			{/* Header */}
			<div className="mb-6">
				<Link href="/admin/users">
					<Button className="mb-4" variant="ghost">
						<ArrowLeft className="mr-2 size-4" />
						Back to Users
					</Button>
				</Link>
				<h1 className="font-bold text-3xl">User Details (Admin)</h1>
				<p className="mt-2 text-muted-foreground">
					View and edit user account information
				</p>
			</div>

			<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
				{/* Profile Summary Card */}
				<Card className="lg:col-span-1">
					<CardHeader>
						<CardTitle>Profile Summary</CardTitle>
						<CardDescription>User account overview</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div>
							<p className="text-muted-foreground text-sm">Name</p>
							<p className="font-medium">
								{profile.firstName} {profile.lastName}
							</p>
						</div>
						<div>
							<p className="text-muted-foreground text-sm">Email</p>
							<p className="font-medium">{profile.email}</p>
						</div>
						<div>
							<p className="text-muted-foreground text-sm">Status</p>
							<Badge variant={getStatusBadgeVariant(profile.status)}>
								{profile.status.charAt(0).toUpperCase() +
									profile.status.slice(1)}
							</Badge>
						</div>
						<div>
							<p className="text-muted-foreground text-sm">User Type</p>
							<p className="font-medium">{formatUserType(profile.userType)}</p>
						</div>
						<div>
							<p className="text-muted-foreground text-sm">Academic Type</p>
							<p className="font-medium">
								{formatAcademicType(profile.academicType)}
							</p>
						</div>
						<Separator />
						<div>
							<p className="text-muted-foreground text-sm">Registered</p>
							<p className="font-medium">{formatDate(profile.createdAt)}</p>
						</div>
						{profile.lastLoginAt && (
							<div>
								<p className="text-muted-foreground text-sm">Last Login</p>
								<p className="font-medium">{formatDate(profile.lastLoginAt)}</p>
							</div>
						)}
					</CardContent>
				</Card>

				{/* Edit Form */}
				<div className="lg:col-span-2">
					<AdminUserEditForm profile={profile} userId={userId} />
				</div>
			</div>
		</div>
	);
}
