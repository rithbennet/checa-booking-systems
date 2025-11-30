"use client";

import {
	AlertCircle,
	Building2,
	Calendar,
	GraduationCap,
	Loader2,
	Mail,
	Phone,
	User,
} from "lucide-react";
import Image from "next/image";
import { useUserProfile } from "@/entities/user";
import { LinkedAccountsCard } from "@/features/users";
import { Badge } from "@/shared/ui/shadcn/badge";
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

export default function ProfilePage() {
	const { data: profile, isLoading, error } = useUserProfile();

	if (isLoading) {
		return (
			<div className="flex min-h-[400px] items-center justify-center">
				<Loader2 className="size-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	if (error || !profile) {
		return (
			<div className="flex min-h-[400px] flex-col items-center justify-center gap-2 text-muted-foreground">
				<AlertCircle className="size-8" />
				<p>Failed to load profile. Please try again.</p>
			</div>
		);
	}

	const hasOrganization =
		profile.organization.faculty ||
		profile.organization.department ||
		profile.organization.ikohza ||
		profile.organization.company ||
		profile.organization.branch;

	return (
		<div className="space-y-6 p-6">
			{/* Page Header */}
			<div>
				<h1 className="font-bold text-2xl text-slate-900">My Profile</h1>
				<p className="text-muted-foreground text-sm">
					View and manage your account information
				</p>
			</div>

			<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
				{/* Profile Summary Card */}
				<Card className="lg:col-span-1">
					<CardHeader className="text-center">
						<div className="mx-auto flex size-20 items-center justify-center rounded-full bg-slate-100">
							{profile.profileImageUrl ? (
								<Image
									alt={`${profile.firstName} ${profile.lastName}`}
									className="size-20 rounded-full object-cover"
									height={80}
									src={profile.profileImageUrl}
									width={80}
								/>
							) : (
								<User className="size-10 text-slate-400" />
							)}
						</div>
						<CardTitle className="mt-4">
							{profile.firstName} {profile.lastName}
						</CardTitle>
						<CardDescription>{profile.email}</CardDescription>
						<div className="mt-2">
							<Badge variant={getStatusBadgeVariant(profile.status)}>
								{profile.status.charAt(0).toUpperCase() +
									profile.status.slice(1)}
							</Badge>
						</div>
					</CardHeader>
					<CardContent>
						<Separator className="my-4" />
						<div className="space-y-3 text-sm">
							<div className="flex items-center gap-2 text-slate-600">
								<Calendar className="size-4" />
								<span>Joined {formatDate(profile.createdAt)}</span>
							</div>
							{profile.lastLoginAt && (
								<div className="flex items-center gap-2 text-slate-600">
									<Calendar className="size-4" />
									<span>Last login {formatDate(profile.lastLoginAt)}</span>
								</div>
							)}
						</div>
					</CardContent>
				</Card>

				{/* Details Cards */}
				<div className="space-y-6 lg:col-span-2">
					{/* Contact Information */}
					<Card>
						<CardHeader>
							<CardTitle className="text-lg">Contact Information</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
								<div className="flex items-start gap-3">
									<Mail className="mt-0.5 size-5 text-slate-400" />
									<div>
										<p className="font-medium text-slate-900 text-sm">Email</p>
										<p className="text-slate-600 text-sm">{profile.email}</p>
									</div>
								</div>
								<div className="flex items-start gap-3">
									<Phone className="mt-0.5 size-5 text-slate-400" />
									<div>
										<p className="font-medium text-slate-900 text-sm">Phone</p>
										<p className="text-slate-600 text-sm">
											{profile.phone || "Not provided"}
										</p>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Account Type */}
					<Card>
						<CardHeader>
							<CardTitle className="text-lg">Account Type</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
								<div className="flex items-start gap-3">
									<User className="mt-0.5 size-5 text-slate-400" />
									<div>
										<p className="font-medium text-slate-900 text-sm">
											User Type
										</p>
										<p className="text-slate-600 text-sm">
											{formatUserType(profile.userType)}
										</p>
									</div>
								</div>
								<div className="flex items-start gap-3">
									<GraduationCap className="mt-0.5 size-5 text-slate-400" />
									<div>
										<p className="font-medium text-slate-900 text-sm">
											Academic Type
										</p>
										<p className="text-slate-600 text-sm">
											{formatAcademicType(profile.academicType)}
										</p>
									</div>
								</div>
								{profile.userIdentifier && (
									<div className="flex items-start gap-3">
										<User className="mt-0.5 size-5 text-slate-400" />
										<div>
											<p className="font-medium text-slate-900 text-sm">
												{profile.academicType === "student"
													? "Matric No."
													: "Staff ID"}
											</p>
											<p className="text-slate-600 text-sm">
												{profile.userIdentifier}
											</p>
										</div>
									</div>
								)}
								{profile.supervisorName && (
									<div className="flex items-start gap-3">
										<User className="mt-0.5 size-5 text-slate-400" />
										<div>
											<p className="font-medium text-slate-900 text-sm">
												Supervisor
											</p>
											<p className="text-slate-600 text-sm">
												{profile.supervisorName}
											</p>
										</div>
									</div>
								)}
							</div>
						</CardContent>
					</Card>

					{/* Organization */}
					{hasOrganization && (
						<Card>
							<CardHeader>
								<CardTitle className="text-lg">Organization</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
									{profile.organization.faculty && (
										<div className="flex items-start gap-3">
											<Building2 className="mt-0.5 size-5 text-slate-400" />
											<div>
												<p className="font-medium text-slate-900 text-sm">
													Faculty
												</p>
												<p className="text-slate-600 text-sm">
													{profile.organization.faculty}
												</p>
											</div>
										</div>
									)}
									{profile.organization.department && (
										<div className="flex items-start gap-3">
											<Building2 className="mt-0.5 size-5 text-slate-400" />
											<div>
												<p className="font-medium text-slate-900 text-sm">
													Department
												</p>
												<p className="text-slate-600 text-sm">
													{profile.organization.department}
												</p>
											</div>
										</div>
									)}
									{profile.organization.ikohza && (
										<div className="flex items-start gap-3">
											<Building2 className="mt-0.5 size-5 text-slate-400" />
											<div>
												<p className="font-medium text-slate-900 text-sm">
													iKohza
												</p>
												<p className="text-slate-600 text-sm">
													{profile.organization.ikohza}
												</p>
											</div>
										</div>
									)}
									{profile.organization.company && (
										<div className="flex items-start gap-3">
											<Building2 className="mt-0.5 size-5 text-slate-400" />
											<div>
												<p className="font-medium text-slate-900 text-sm">
													Company
												</p>
												<p className="text-slate-600 text-sm">
													{profile.organization.company}
												</p>
											</div>
										</div>
									)}
									{profile.organization.branch && (
										<div className="flex items-start gap-3">
											<Building2 className="mt-0.5 size-5 text-slate-400" />
											<div>
												<p className="font-medium text-slate-900 text-sm">
													Branch
												</p>
												<p className="text-slate-600 text-sm">
													{profile.organization.branch}
												</p>
											</div>
										</div>
									)}
								</div>
							</CardContent>
						</Card>
					)}

					{/* Linked Accounts */}
					<LinkedAccountsCard />
				</div>
			</div>
		</div>
	);
}
