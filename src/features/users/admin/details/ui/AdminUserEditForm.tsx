"use client";

import { Loader2, Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useAdminUpdateUser, useOnboardingOptions } from "@/entities/user";
import type {
	AcademicType,
	UserStatus,
	UserType,
} from "@/entities/user/model/types";
import type { UserProfileVM } from "@/entities/user/server/profile-repository";
import { Button } from "@/shared/ui/shadcn/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/shared/ui/shadcn/card";
import { Input } from "@/shared/ui/shadcn/input";
import { Label } from "@/shared/ui/shadcn/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/shared/ui/shadcn/select";
import { Separator } from "@/shared/ui/shadcn/separator";

interface AdminUserEditFormProps {
	profile: UserProfileVM;
	userId: string;
}

export function AdminUserEditForm({ profile, userId }: AdminUserEditFormProps) {
	const { data: options } = useOnboardingOptions();
	const { mutateAsync: updateUser, isPending } = useAdminUpdateUser();

	// Form state
	const [formData, setFormData] = useState({
		firstName: profile.firstName,
		lastName: profile.lastName,
		phone: profile.phone || "",
		userType: profile.userType as UserType,
		academicType: profile.academicType as AcademicType,
		userIdentifier: profile.userIdentifier || "",
		supervisorName: profile.supervisorName || "",
		facultyId: profile.organization.facultyId || "",
		departmentId: profile.organization.departmentId || "",
		ikohzaId: profile.organization.ikohzaId || "",
		companyId: profile.organization.companyId || "",
		companyBranchId: profile.organization.companyBranchId || "",
		status: profile.status as UserStatus,
	});

	// Update form when profile changes
	useEffect(() => {
		setFormData({
			firstName: profile.firstName,
			lastName: profile.lastName,
			phone: profile.phone || "",
			userType: profile.userType as UserType,
			academicType: profile.academicType as AcademicType,
			userIdentifier: profile.userIdentifier || "",
			supervisorName: profile.supervisorName || "",
			facultyId: profile.organization.facultyId || "",
			departmentId: profile.organization.departmentId || "",
			ikohzaId: profile.organization.ikohzaId || "",
			companyId: profile.organization.companyId || "",
			companyBranchId: profile.organization.companyBranchId || "",
			status: profile.status as UserStatus,
		});
	}, [profile]);

	// Filter faculties by user type
	const filteredFaculties = useMemo(() => {
		if (!options?.faculties) return [];

		if (formData.userType === "mjiit_member") {
			// Only show MJIIT faculty for MJIIT members
			return options.faculties.filter((f) => f.isMjiit);
		}

		if (formData.userType === "utm_member") {
			// Exclude MJIIT faculty for UTM members
			return options.faculties.filter((f) => !f.isMjiit);
		}

		// For other types (external, admin), show all faculties
		return options.faculties;
	}, [options?.faculties, formData.userType]);

	// Filter departments by selected faculty
	const filteredDepartments = useMemo(() => {
		if (!options?.departments || !formData.facultyId) return [];
		return options.departments.filter(
			(d) => d.facultyId === formData.facultyId,
		);
	}, [options?.departments, formData.facultyId]);

	// Filter ikohzas by selected faculty - only show for MJIIT members
	const filteredIkohzas = useMemo(() => {
		if (
			!options?.ikohzas ||
			!formData.facultyId ||
			formData.userType !== "mjiit_member"
		) {
			return [];
		}
		return options.ikohzas.filter((i) => i.facultyId === formData.facultyId);
	}, [options?.ikohzas, formData.facultyId, formData.userType]);

	const filteredBranches = useMemo(() => {
		if (!options?.companyBranches || !formData.companyId) return [];
		return options.companyBranches.filter(
			(b) => b.companyId === formData.companyId,
		);
	}, [options?.companyBranches, formData.companyId]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		try {
			// Ensure ikohzaId is null for UTM members
			const ikohzaId =
				formData.userType === "utm_member" ? null : formData.ikohzaId || null;

			const response = await updateUser({
				userId,
				input: {
					firstName: formData.firstName,
					lastName: formData.lastName,
					phone: formData.phone || null,
					userType: formData.userType,
					academicType: formData.academicType,
					userIdentifier: formData.userIdentifier || null,
					supervisorName: formData.supervisorName || null,
					facultyId: formData.facultyId || null,
					departmentId: formData.departmentId || null,
					ikohzaId,
					companyId: formData.companyId || null,
					companyBranchId: formData.companyBranchId || null,
					status: formData.status,
				},
			});

			// Show toast based on whether fields were changed
			if (response.changedFields && response.changedFields.length > 0) {
				toast.success("User updated successfully", {
					description: "The user has been notified of the changes.",
				});
			} else {
				toast.success("User updated successfully");
			}
		} catch (error) {
			toast.error("Failed to update user", {
				description:
					error instanceof Error ? error.message : "An error occurred",
			});
		}
	};

	const isInternalMember =
		formData.userType === "mjiit_member" || formData.userType === "utm_member";
	const isExternalMember = formData.userType === "external_member";

	return (
		<form className="space-y-6" onSubmit={handleSubmit}>
			{/* Basic Information */}
			<Card>
				<CardHeader>
					<CardTitle>Basic Information</CardTitle>
					<CardDescription>Update user's basic details</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<div className="space-y-2">
							<Label htmlFor="firstName">First Name</Label>
							<Input
								id="firstName"
								onChange={(e) =>
									setFormData({ ...formData, firstName: e.target.value })
								}
								required
								value={formData.firstName}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="lastName">Last Name</Label>
							<Input
								id="lastName"
								onChange={(e) =>
									setFormData({ ...formData, lastName: e.target.value })
								}
								required
								value={formData.lastName}
							/>
						</div>
					</div>
					<div className="space-y-2">
						<Label htmlFor="phone">Phone</Label>
						<Input
							id="phone"
							onChange={(e) =>
								setFormData({ ...formData, phone: e.target.value })
							}
							type="tel"
							value={formData.phone}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="email">Email</Label>
						<Input disabled id="email" value={profile.email} />
						<p className="text-muted-foreground text-xs">
							Email cannot be changed by admins
						</p>
					</div>
				</CardContent>
			</Card>

			{/* Account Type */}
			<Card>
				<CardHeader>
					<CardTitle>Account Type</CardTitle>
					<CardDescription>User type and academic status</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<div className="space-y-2">
							<Label htmlFor="userType">User Type</Label>
							<Select
								onValueChange={(value) => {
									const newUserType = value as UserType;
									setFormData({
										...formData,
										userType: newUserType,
										// Reset organization fields when user type changes
										facultyId: "",
										departmentId: "",
										ikohzaId: "", // Always clear ikohza when user type changes
										companyId: "",
										companyBranchId: "",
									});
								}}
								value={formData.userType}
							>
								<SelectTrigger id="userType">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="mjiit_member">MJIIT Member</SelectItem>
									<SelectItem value="utm_member">UTM Member</SelectItem>
									<SelectItem value="external_member">
										External Member
									</SelectItem>
									<SelectItem value="lab_administrator">
										Lab Administrator
									</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label htmlFor="academicType">Academic Type</Label>
							<Select
								onValueChange={(value) =>
									setFormData({
										...formData,
										academicType: value as AcademicType,
									})
								}
								value={formData.academicType}
							>
								<SelectTrigger id="academicType">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="student">Student</SelectItem>
									<SelectItem value="staff">Staff</SelectItem>
									<SelectItem value="none">N/A</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
					<div className="space-y-2">
						<Label htmlFor="status">Account Status</Label>
						<Select
							onValueChange={(value) =>
								setFormData({ ...formData, status: value as UserStatus })
							}
							value={formData.status}
						>
							<SelectTrigger id="status">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="pending">Pending</SelectItem>
								<SelectItem value="active">Active</SelectItem>
								<SelectItem value="inactive">Inactive</SelectItem>
								<SelectItem value="rejected">Rejected</SelectItem>
								<SelectItem value="suspended">Suspended</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</CardContent>
			</Card>

			{/* Identifiers */}
			<Card>
				<CardHeader>
					<CardTitle>Identifiers</CardTitle>
					<CardDescription>
						User identifier and supervisor information
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="userIdentifier">
							{formData.academicType === "student"
								? "Matric Number"
								: formData.academicType === "staff"
									? "Staff ID"
									: "User Identifier"}
						</Label>
						<Input
							id="userIdentifier"
							onChange={(e) =>
								setFormData({ ...formData, userIdentifier: e.target.value })
							}
							value={formData.userIdentifier}
						/>
					</div>
					{formData.academicType === "student" && (
						<div className="space-y-2">
							<Label htmlFor="supervisorName">Supervisor Name</Label>
							<Input
								id="supervisorName"
								onChange={(e) =>
									setFormData({
										...formData,
										supervisorName: e.target.value,
									})
								}
								value={formData.supervisorName}
							/>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Organization - Internal Members */}
			{isInternalMember && (
				<Card>
					<CardHeader>
						<CardTitle>Organization</CardTitle>
						<CardDescription>Faculty, department, and iKohza</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="facultyId">Faculty</Label>
							<Select
								onValueChange={(value) =>
									setFormData({
										...formData,
										facultyId: value,
										departmentId: "",
										ikohzaId: "",
									})
								}
								value={formData.facultyId}
							>
								<SelectTrigger id="facultyId">
									<SelectValue placeholder="Select faculty" />
								</SelectTrigger>
								<SelectContent>
									{filteredFaculties.map((faculty) => (
										<SelectItem key={faculty.id} value={faculty.id}>
											{faculty.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						{formData.facultyId && (
							<>
								<div className="space-y-2">
									<Label htmlFor="departmentId">Department</Label>
									<Select
										onValueChange={(value) =>
											setFormData({ ...formData, departmentId: value })
										}
										value={formData.departmentId}
									>
										<SelectTrigger id="departmentId">
											<SelectValue placeholder="Select department" />
										</SelectTrigger>
										<SelectContent>
											{filteredDepartments.map((dept) => (
												<SelectItem key={dept.id} value={dept.id}>
													{dept.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
								{/* Only show iKohza for MJIIT members */}
								{formData.userType === "mjiit_member" && (
									<div className="space-y-2">
										<Label htmlFor="ikohzaId">iKohza</Label>
										<Select
											onValueChange={(value) =>
												setFormData({ ...formData, ikohzaId: value })
											}
											value={formData.ikohzaId}
										>
											<SelectTrigger id="ikohzaId">
												<SelectValue placeholder="Select iKohza" />
											</SelectTrigger>
											<SelectContent>
												{filteredIkohzas.map((ikohza) => (
													<SelectItem key={ikohza.id} value={ikohza.id}>
														{ikohza.name}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
								)}
							</>
						)}
					</CardContent>
				</Card>
			)}

			{/* Organization - External Members */}
			{isExternalMember && (
				<Card>
					<CardHeader>
						<CardTitle>Organization</CardTitle>
						<CardDescription>Company and branch</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="companyId">Company</Label>
							<Select
								onValueChange={(value) =>
									setFormData({
										...formData,
										companyId: value,
										companyBranchId: "",
									})
								}
								value={formData.companyId}
							>
								<SelectTrigger id="companyId">
									<SelectValue placeholder="Select company" />
								</SelectTrigger>
								<SelectContent>
									{options?.companies.map((company) => (
										<SelectItem key={company.id} value={company.id}>
											{company.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						{formData.companyId && (
							<div className="space-y-2">
								<Label htmlFor="companyBranchId">Branch</Label>
								<Select
									onValueChange={(value) =>
										setFormData({ ...formData, companyBranchId: value })
									}
									value={formData.companyBranchId}
								>
									<SelectTrigger id="companyBranchId">
										<SelectValue placeholder="Select branch" />
									</SelectTrigger>
									<SelectContent>
										{filteredBranches.map((branch) => (
											<SelectItem key={branch.id} value={branch.id}>
												{branch.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						)}
					</CardContent>
				</Card>
			)}

			<Separator />

			<div className="flex justify-end gap-2">
				<Button disabled={isPending} type="submit">
					{isPending ? (
						<>
							<Loader2 className="mr-2 size-4 animate-spin" />
							Saving...
						</>
					) : (
						<>
							<Save className="mr-2 size-4" />
							Save Changes
						</>
					)}
				</Button>
			</div>
		</form>
	);
}
