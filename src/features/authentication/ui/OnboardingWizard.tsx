"use client";

import { Building2, GraduationCap, Loader2, User } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useOnboardingOptions } from "@/entities/user";
import { Button } from "@/shared/ui/shadcn/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/shared/ui/shadcn/card";
import { Checkbox } from "@/shared/ui/shadcn/checkbox";
import { Input } from "@/shared/ui/shadcn/input";
import { Label } from "@/shared/ui/shadcn/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/shared/ui/shadcn/select";
import { Textarea } from "@/shared/ui/shadcn/textarea";

// ==============================================================
// Types
// ==============================================================

type UserCategory = "internal" | "external";

interface FormState {
	firstName: string;
	lastName: string;
	phone: string;
	acceptedTerms: boolean;
	// Internal user fields
	facultyId: string;
	departmentId: string;
	ikohzaId: string;
	academicType: "student" | "staff" | "";
	userIdentifier: string;
	supervisorName: string;
	// External user fields
	companyId: string;
	companyBranchId: string;
	newCompanyName: string;
	newCompanyAddress: string;
	newCompanyBranchName: string;
	newBranchName: string;
	newBranchAddress: string;
}

interface FormErrors {
	firstName?: string;
	lastName?: string;
	phone?: string;
	acceptedTerms?: string;
	facultyId?: string;
	departmentId?: string;
	ikohzaId?: string;
	academicType?: string;
	userIdentifier?: string;
	supervisorName?: string;
	newCompanyName?: string;
	newCompanyAddress?: string;
	newCompanyBranchName?: string;
	newBranchName?: string;
	newBranchAddress?: string;
}

// ==============================================================
// Props
// ==============================================================

interface OnboardingWizardProps {
	email: string;
	name?: string;
	image?: string;
}

// ==============================================================
// Component
// ==============================================================

export function OnboardingWizard({
	email,
	name,
	image,
}: OnboardingWizardProps) {
	const [error, setError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [formErrors, setFormErrors] = useState<FormErrors>({});

	// Fetch dropdown options
	const { data: options, isLoading: optionsLoading } = useOnboardingOptions();

	// Detect user category from email
	const userCategory: UserCategory = useMemo(() => {
		if (email.includes("@utm.my") || email.includes("@graduate.utm.my")) {
			return "internal";
		}
		return "external";
	}, [email]);

	// Parse name from OAuth provider
	const nameParts = name?.trim().split(" ") ?? [];
	const defaultFirstName = nameParts[0] ?? "";
	const defaultLastName = nameParts.slice(1).join(" ") ?? "";

	// Form state
	const [formState, setFormState] = useState<FormState>({
		firstName: defaultFirstName,
		lastName: defaultLastName,
		phone: "",
		acceptedTerms: false,
		facultyId: "",
		departmentId: "",
		ikohzaId: "",
		academicType: "",
		userIdentifier: "",
		supervisorName: "",
		companyId: "",
		companyBranchId: "",
		newCompanyName: "",
		newCompanyAddress: "",
		newCompanyBranchName: "",
		newBranchName: "",
		newBranchAddress: "",
	});

	// Update form when name changes
	useEffect(() => {
		setFormState((prev) => ({
			...prev,
			firstName: defaultFirstName,
			lastName: defaultLastName,
		}));
	}, [defaultFirstName, defaultLastName]);

	// Determine if selected faculty is MJIIT
	const selectedFaculty = options?.faculties.find(
		(f) => f.id === formState.facultyId,
	);
	const isMjiit = selectedFaculty?.isMjiit ?? false;

	// Filter departments/ikohzas by selected faculty
	const filteredDepartments = useMemo(() => {
		if (!options?.departments || !formState.facultyId) return [];
		return options.departments.filter(
			(d) => d.facultyId === formState.facultyId,
		);
	}, [options?.departments, formState.facultyId]);

	const filteredIkohzas = useMemo(() => {
		if (!options?.ikohzas || !formState.facultyId) return [];
		return options.ikohzas.filter((i) => i.facultyId === formState.facultyId);
	}, [options?.ikohzas, formState.facultyId]);

	// Filter branches by selected company
	const filteredBranches = useMemo(() => {
		if (!options?.companyBranches || !formState.companyId) return [];
		return options.companyBranches.filter(
			(b) => b.companyId === formState.companyId,
		);
	}, [options?.companyBranches, formState.companyId]);

	// Handle input changes
	const handleChange = (field: keyof FormState, value: string | boolean) => {
		setFormState((prev) => ({ ...prev, [field]: value }));
		// Clear error for this field
		if (formErrors[field as keyof FormErrors]) {
			setFormErrors((prev) => ({ ...prev, [field]: undefined }));
		}
	};

	// Handle faculty change - reset department/ikohza
	const handleFacultyChange = (value: string) => {
		setFormState((prev) => ({
			...prev,
			facultyId: value,
			departmentId: "",
			ikohzaId: "",
		}));
	};

	// Handle company change - reset branch
	const handleCompanyChange = (value: string) => {
		if (value === "new") {
			setFormState((prev) => ({
				...prev,
				companyId: "",
				companyBranchId: "",
				newBranchName: "",
				newBranchAddress: "",
			}));
		} else {
			setFormState((prev) => ({
				...prev,
				companyId: value,
				companyBranchId: "",
				newCompanyName: "",
				newCompanyAddress: "",
				newCompanyBranchName: "",
				newBranchName: "",
				newBranchAddress: "",
			}));
		}
	};

	// Handle branch change - support adding new branch
	const handleBranchChange = (value: string) => {
		if (value === "new") {
			setFormState((prev) => ({
				...prev,
				companyBranchId: "",
			}));
		} else {
			setFormState((prev) => ({
				...prev,
				companyBranchId: value,
				newBranchName: "",
				newBranchAddress: "",
			}));
		}
	};

	// Validate form
	const validateForm = (): boolean => {
		const errors: FormErrors = {};

		if (!formState.firstName.trim()) {
			errors.firstName = "First name is required";
		}
		if (!formState.lastName.trim()) {
			errors.lastName = "Last name is required";
		}
		if (!formState.phone.trim()) {
			errors.phone = "Phone number is required";
		}
		if (!formState.acceptedTerms) {
			errors.acceptedTerms = "You must accept the Terms & Privacy";
		}

		if (userCategory === "internal") {
			if (!formState.facultyId) {
				errors.facultyId = "Please select a faculty";
			}
			// Department is required for all internal members
			if (formState.facultyId && !formState.departmentId) {
				errors.departmentId = "Please select a department";
			}
			// iKohza is required for MJIIT members (in addition to department)
			if (isMjiit && !formState.ikohzaId) {
				errors.ikohzaId = "Please select an iKohza";
			}
			if (!formState.academicType) {
				errors.academicType =
					"Please select whether you are a student or staff";
			}
			if (!formState.userIdentifier.trim()) {
				errors.userIdentifier = "Matric number or staff ID is required";
			}
			if (
				formState.academicType === "student" &&
				!formState.supervisorName.trim()
			) {
				errors.supervisorName = "Supervisor name is required for students";
			}
		} else {
			// External user validation
			if (!formState.companyId && !formState.newCompanyName.trim()) {
				errors.newCompanyName = "Please select or enter a company name";
			}
			// Require branch name when creating new company
			if (
				!formState.companyId &&
				formState.newCompanyName.trim() &&
				!formState.newCompanyBranchName?.trim()
			) {
				errors.newCompanyBranchName =
					"Branch name is required when creating a new company";
			}
			// Require address when creating new company
			if (
				!formState.companyId &&
				formState.newCompanyName.trim() &&
				!formState.newCompanyAddress?.trim()
			) {
				errors.newCompanyAddress =
					"Branch address is required to create your organization record";
			}
			// Require branch selection/creation when company is selected
			if (formState.companyId) {
				if (!formState.companyBranchId && !formState.newBranchName.trim()) {
					errors.newBranchName = "Please select a branch or create a new one";
				}
				// Require address when creating new branch
				if (
					!formState.companyBranchId &&
					formState.newBranchName.trim() &&
					!formState.newBranchAddress?.trim()
				) {
					errors.newBranchAddress =
						"Branch address is required to create your branch record";
				}
			}
		}

		setFormErrors(errors);
		return Object.keys(errors).length === 0;
	};

	// Handle form submission
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);

		if (!validateForm()) {
			return;
		}

		setIsSubmitting(true);

		try {
			// Determine the API user type
			let userType: "mjiit_member" | "utm_member" | "external_member";

			if (userCategory === "internal") {
				userType = isMjiit ? "mjiit_member" : "utm_member";
			} else {
				userType = "external_member";
			}

			// Build request payload
			const payload: Record<string, unknown> = {
				firstName: formState.firstName.trim(),
				lastName: formState.lastName.trim(),
				phone: formState.phone || undefined,
				userType,
			};

			if (userCategory === "internal") {
				payload.facultyId = formState.facultyId;
				payload.academicType = formState.academicType;
				payload.userIdentifier = formState.userIdentifier;

				if (formState.academicType === "student") {
					payload.supervisorName = formState.supervisorName;
				}

				// Department is required for all internal members
				if (formState.departmentId) {
					payload.departmentId = formState.departmentId;
				}

				// iKohza is required for MJIIT members (in addition to department)
				if (isMjiit && formState.ikohzaId) {
					payload.ikohzaId = formState.ikohzaId;
				}
			} else {
				// External user
				if (formState.companyId) {
					payload.companyId = formState.companyId;
					if (formState.companyBranchId) {
						payload.companyBranchId = formState.companyBranchId;
					} else if (formState.newBranchName) {
						// Adding new branch to existing company
						payload.newBranchName = formState.newBranchName;
						payload.newBranchAddress = formState.newBranchAddress;
					}
				} else if (formState.newCompanyName) {
					payload.newCompanyName = formState.newCompanyName;
					payload.newCompanyAddress = formState.newCompanyAddress;
					if (formState.newCompanyBranchName) {
						payload.newCompanyBranchName = formState.newCompanyBranchName;
					}
				}
			}

			const res = await fetch("/api/auth/complete-onboarding", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});

			const responseData = (await res.json().catch(() => ({}))) as {
				message?: string;
				error?: string;
				details?: Record<string, string[]>;
			};

			if (!res.ok) {
				setError(responseData?.error ?? "Failed to complete onboarding");
				return;
			}

			// Redirect to dashboard after successful onboarding
			// Use window.location.href to force a full page reload and fetch fresh session
			window.location.href = "/dashboard";
		} catch {
			setError("Unexpected error. Please try again.");
		} finally {
			setIsSubmitting(false);
		}
	};

	// Loading state
	if (optionsLoading) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-linear-to-br from-blue-50 to-indigo-100">
				<Loader2 className="size-8 animate-spin text-blue-600" />
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100">
			<main className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
				<Card className="shadow-lg">
					<CardHeader className="text-center">
						<div className="mx-auto flex size-20 items-center justify-center rounded-full bg-slate-100">
							{image ? (
								<Image
									alt="Profile"
									className="size-20 rounded-full object-cover"
									height={80}
									src={image}
									width={80}
								/>
							) : (
								<User className="size-10 text-slate-400" />
							)}
						</div>
						<CardTitle className="mt-4 font-bold text-2xl text-gray-900">
							Complete Your Profile
						</CardTitle>
						<CardDescription className="text-gray-600">
							Welcome! Please provide a few more details to finish setting up
							your ChECA Lab account.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-6">
						<div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
							<p className="text-blue-700 text-sm">
								Signed in with Google as <strong>{email}</strong>
							</p>
						</div>

						<form className="space-y-6" onSubmit={handleSubmit}>
							{/* Basic Info */}
							<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
								<div className="space-y-2">
									<Label
										className="font-medium text-gray-700 text-sm"
										htmlFor="first-name"
									>
										First Name <span className="text-red-500">*</span>
									</Label>
									<Input
										aria-invalid={formErrors.firstName ? "true" : "false"}
										className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
										id="first-name"
										onChange={(e) => handleChange("firstName", e.target.value)}
										placeholder="Enter your first name"
										value={formState.firstName}
									/>
									{formErrors.firstName && (
										<p className="text-red-600 text-sm">
											{formErrors.firstName}
										</p>
									)}
								</div>
								<div className="space-y-2">
									<Label
										className="font-medium text-gray-700 text-sm"
										htmlFor="last-name"
									>
										Last Name <span className="text-red-500">*</span>
									</Label>
									<Input
										aria-invalid={formErrors.lastName ? "true" : "false"}
										className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
										id="last-name"
										onChange={(e) => handleChange("lastName", e.target.value)}
										placeholder="Enter your last name"
										value={formState.lastName}
									/>
									{formErrors.lastName && (
										<p className="text-red-600 text-sm">
											{formErrors.lastName}
										</p>
									)}
								</div>
							</div>

							{/* Phone (required) */}
							<div className="space-y-2">
								<Label
									className="font-medium text-gray-700 text-sm"
									htmlFor="phone"
								>
									Phone Number <span className="text-red-500">*</span>
								</Label>
								<Input
									aria-invalid={formErrors.phone ? "true" : "false"}
									className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
									id="phone"
									onChange={(e) => handleChange("phone", e.target.value)}
									placeholder="Enter your phone number"
									type="tel"
									value={formState.phone}
								/>
								{formErrors.phone && (
									<p className="text-red-600 text-sm">{formErrors.phone}</p>
								)}
							</div>

							{/* Email display (read-only) */}
							<div className="space-y-2">
								<Label className="font-medium text-gray-700 text-sm">
									Email Address
								</Label>
								<Input
									className="h-11 border-gray-300 bg-gray-50"
									disabled
									value={email}
								/>
								{userCategory === "internal" && (
									<p className="flex items-center text-green-600 text-xs">
										<span className="mr-1">✓</span>
										Recognized as UTM/MJIIT institutional email
									</p>
								)}
							</div>

							{/* Internal User Form */}
							{userCategory === "internal" && (
								<Card className="border-blue-200 bg-blue-50">
									<CardHeader className="pb-3">
										<CardTitle className="flex items-center text-lg">
											<GraduationCap className="mr-2 h-5 w-5 text-blue-600" />
											Institutional Member (MJIIT/UTM)
										</CardTitle>
									</CardHeader>
									<CardContent className="space-y-4">
										{/* Faculty Selection */}
										<div className="space-y-2">
											<Label htmlFor="faculty">
												Faculty <span className="text-red-500">*</span>
											</Label>
											<Select
												onValueChange={handleFacultyChange}
												value={formState.facultyId}
											>
												<SelectTrigger className="w-full">
													<SelectValue placeholder="Select Faculty" />
												</SelectTrigger>
												<SelectContent>
													{options?.faculties.map((faculty) => (
														<SelectItem key={faculty.id} value={faculty.id}>
															<span className="truncate" title={faculty.name}>
																{faculty.name}
															</span>
														</SelectItem>
													))}
												</SelectContent>
											</Select>
											{formErrors.facultyId && (
												<p className="text-red-600 text-sm">
													{formErrors.facultyId}
												</p>
											)}
										</div>

										{/* Department (required for all internal members) */}
										{formState.facultyId && (
											<div className="space-y-2">
												<Label htmlFor="department">
													Department <span className="text-red-500">*</span>
												</Label>
												<Select
													onValueChange={(value) =>
														handleChange("departmentId", value)
													}
													value={formState.departmentId}
												>
													<SelectTrigger className="w-full">
														<SelectValue placeholder="Select Department" />
													</SelectTrigger>
													<SelectContent>
														{filteredDepartments.map((dept) => (
															<SelectItem key={dept.id} value={dept.id}>
																<span className="truncate" title={dept.name}>
																	{dept.name}
																</span>
															</SelectItem>
														))}
													</SelectContent>
												</Select>
												{formErrors.departmentId && (
													<p className="text-red-600 text-sm">
														{formErrors.departmentId}
													</p>
												)}
											</div>
										)}

										{/* iKohza (required for MJIIT only) */}
										{isMjiit && formState.facultyId && (
											<div className="space-y-2">
												<Label htmlFor="ikohza">
													iKohza <span className="text-red-500">*</span>
												</Label>
												<Select
													onValueChange={(value) =>
														handleChange("ikohzaId", value)
													}
													value={formState.ikohzaId}
												>
													<SelectTrigger className="w-full">
														<SelectValue placeholder="Select iKohza" />
													</SelectTrigger>
													<SelectContent>
														{filteredIkohzas.map((ikohza) => (
															<SelectItem key={ikohza.id} value={ikohza.id}>
																<span className="truncate" title={ikohza.name}>
																	{ikohza.name}
																</span>
															</SelectItem>
														))}
													</SelectContent>
												</Select>
												{formErrors.ikohzaId && (
													<p className="text-red-600 text-sm">
														{formErrors.ikohzaId}
													</p>
												)}
											</div>
										)}

										{/* Academic Role - Radio-style selection for better visibility */}
										<div className="space-y-2">
											<Label>
												Are you a Student or Staff?{" "}
												<span className="text-red-500">*</span>
											</Label>
											<div className="grid grid-cols-2 gap-3">
												<button
													className={`flex items-center justify-center gap-2 rounded-lg border-2 p-4 transition-colors ${
														formState.academicType === "student"
															? "border-blue-500 bg-blue-50 text-blue-700"
															: "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
													}`}
													onClick={() =>
														handleChange("academicType", "student")
													}
													type="button"
												>
													<GraduationCap className="h-5 w-5" />
													<span className="font-medium">Student</span>
												</button>
												<button
													className={`flex items-center justify-center gap-2 rounded-lg border-2 p-4 transition-colors ${
														formState.academicType === "staff"
															? "border-blue-500 bg-blue-50 text-blue-700"
															: "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
													}`}
													onClick={() => handleChange("academicType", "staff")}
													type="button"
												>
													<User className="h-5 w-5" />
													<span className="font-medium">Staff</span>
												</button>
											</div>
											{formErrors.academicType && (
												<p className="text-red-600 text-sm">
													{formErrors.academicType}
												</p>
											)}
										</div>

										{/* Matric / Staff ID */}
										<div className="space-y-2">
											<Label htmlFor="userIdentifier">
												{formState.academicType === "student"
													? "Matric Number"
													: "Staff ID"}{" "}
												<span className="text-red-500">*</span>
											</Label>
											<Input
												className="h-11"
												id="userIdentifier"
												onChange={(e) =>
													handleChange("userIdentifier", e.target.value)
												}
												placeholder={
													formState.academicType === "student"
														? "Enter your Matric Number"
														: "Enter your Staff ID"
												}
												value={formState.userIdentifier}
											/>
											{formErrors.userIdentifier && (
												<p className="text-red-600 text-sm">
													{formErrors.userIdentifier}
												</p>
											)}
										</div>

										{/* Supervisor Name (for students) */}
										{formState.academicType === "student" && (
											<div className="space-y-2">
												<Label htmlFor="supervisorName">
													Supervisor Name{" "}
													<span className="text-red-500">*</span>
												</Label>
												<Input
													className="h-11"
													id="supervisorName"
													onChange={(e) =>
														handleChange("supervisorName", e.target.value)
													}
													placeholder="Enter your supervisor's name"
													value={formState.supervisorName}
												/>
												{formErrors.supervisorName && (
													<p className="text-red-600 text-sm">
														{formErrors.supervisorName}
													</p>
												)}
											</div>
										)}
									</CardContent>
								</Card>
							)}

							{/* External User Form */}
							{userCategory === "external" && (
								<Card className="border-orange-200 bg-orange-50">
									<CardHeader className="pb-3">
										<CardTitle className="flex items-center text-lg">
											<Building2 className="mr-2 h-5 w-5 text-orange-600" />
											External Member
										</CardTitle>
									</CardHeader>
									<CardContent className="space-y-4">
										{/* Company Selection */}
										<div className="space-y-2">
											<Label htmlFor="company">Company/Institution</Label>
											<Select
												onValueChange={handleCompanyChange}
												value={formState.companyId || "new"}
											>
												<SelectTrigger className="w-full">
													<SelectValue placeholder="Select or add company" />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="new">+ Add New Company</SelectItem>
													{options?.companies.map((company) => (
														<SelectItem key={company.id} value={company.id}>
															<span className="truncate" title={company.name}>
																{company.name}
															</span>
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>

										{/* New Company Fields */}
										{!formState.companyId && (
											<>
												<div className="space-y-2">
													<Label htmlFor="newCompanyName">
														Company Name <span className="text-red-500">*</span>
													</Label>
													<Input
														className="h-11"
														id="newCompanyName"
														onChange={(e) =>
															handleChange("newCompanyName", e.target.value)
														}
														placeholder="Enter your company name"
														value={formState.newCompanyName}
													/>
													{formErrors.newCompanyName && (
														<p className="text-red-600 text-sm">
															{formErrors.newCompanyName}
														</p>
													)}
												</div>
												<div className="space-y-2">
													<Label htmlFor="newCompanyBranchName">
														Branch Name <span className="text-red-500">*</span>
													</Label>
													<Input
														className="h-11"
														id="newCompanyBranchName"
														onChange={(e) =>
															handleChange(
																"newCompanyBranchName",
																e.target.value,
															)
														}
														placeholder="e.g., Main Office, Headquarters, KL Branch"
														value={formState.newCompanyBranchName}
													/>
													{formErrors.newCompanyBranchName && (
														<p className="text-red-600 text-sm">
															{formErrors.newCompanyBranchName}
														</p>
													)}
												</div>
												<div className="space-y-2">
													<Label htmlFor="newCompanyAddress">
														Branch Address{" "}
														<span className="text-red-500">*</span>
													</Label>
													<Textarea
														aria-invalid={
															formErrors.newCompanyAddress ? "true" : "false"
														}
														id="newCompanyAddress"
														onChange={(e) =>
															handleChange("newCompanyAddress", e.target.value)
														}
														placeholder="Enter complete company address (required)"
														rows={3}
														value={formState.newCompanyAddress}
													/>
													{formErrors.newCompanyAddress && (
														<p className="text-red-600 text-sm">
															{formErrors.newCompanyAddress}
														</p>
													)}
												</div>
											</>
										)}

										{/* Branch Selection (if company selected) */}
										{formState.companyId && (
											<>
												<div className="space-y-2">
													<Label htmlFor="branch">Branch</Label>
													<Select
														onValueChange={handleBranchChange}
														value={formState.companyBranchId || "new"}
													>
														<SelectTrigger className="w-full">
															<SelectValue placeholder="Select or add branch" />
														</SelectTrigger>
														<SelectContent>
															<SelectItem value="new">
																+ Add New Branch
															</SelectItem>
															{filteredBranches.map((branch) => {
																const displayName = branch.city
																	? `${branch.name} - ${branch.city}`
																	: branch.name;
																return (
																	<SelectItem key={branch.id} value={branch.id}>
																		<span
																			className="truncate"
																			title={displayName}
																		>
																			{displayName}
																		</span>
																	</SelectItem>
																);
															})}
														</SelectContent>
													</Select>
												</div>

												{/* New Branch Fields */}
												{!formState.companyBranchId && (
													<>
														<div className="space-y-2">
															<Label htmlFor="newBranchName">
																Branch Name{" "}
																<span className="text-red-500">*</span>
															</Label>
															<Input
																aria-invalid={
																	formErrors.newBranchName ? "true" : "false"
																}
																className="h-11"
																id="newBranchName"
																onChange={(e) =>
																	handleChange("newBranchName", e.target.value)
																}
																placeholder="e.g., Main Office, KL Branch"
																value={formState.newBranchName}
															/>
															{formErrors.newBranchName && (
																<p className="text-red-600 text-sm">
																	{formErrors.newBranchName}
																</p>
															)}
														</div>
														<div className="space-y-2">
															<Label htmlFor="newBranchAddress">
																Branch Address{" "}
																<span className="text-red-500">*</span>
															</Label>
															<Textarea
																aria-invalid={
																	formErrors.newBranchAddress ? "true" : "false"
																}
																id="newBranchAddress"
																onChange={(e) =>
																	handleChange(
																		"newBranchAddress",
																		e.target.value,
																	)
																}
																placeholder="Enter complete branch address (required)"
																rows={2}
																value={formState.newBranchAddress}
															/>
															{formErrors.newBranchAddress && (
																<p className="text-red-600 text-sm">
																	{formErrors.newBranchAddress}
																</p>
															)}
														</div>
													</>
												)}
											</>
										)}
									</CardContent>
								</Card>
							)}

							{/* Terms & Conditions */}
							<div className="space-y-2">
								<div className="flex items-center space-x-2">
									<Checkbox
										aria-invalid={formErrors.acceptedTerms ? "true" : "false"}
										checked={formState.acceptedTerms}
										id="terms"
										onCheckedChange={(checked) =>
											handleChange("acceptedTerms", checked === true)
										}
									/>
									<Label className="text-sm" htmlFor="terms">
										I agree to the{" "}
										<a
											className="text-blue-600 hover:text-blue-800"
											href="/terms"
											rel="noopener noreferrer"
											target="_blank"
										>
											Terms & Conditions
										</a>{" "}
										and{" "}
										<a
											className="text-blue-600 hover:text-blue-800"
											href="/privacy"
											rel="noopener noreferrer"
											target="_blank"
										>
											Privacy Policy
										</a>
									</Label>
								</div>
								{formErrors.acceptedTerms && (
									<p className="text-red-600 text-sm">
										{formErrors.acceptedTerms}
									</p>
								)}
							</div>

							{/* Error Display */}
							{error && <p className="text-red-600 text-sm">{error}</p>}

							{/* Submit Button */}
							<Button
								className="h-12 w-full bg-blue-600 text-base hover:bg-blue-700"
								disabled={isSubmitting}
								type="submit"
							>
								{isSubmitting ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Setting up your account...
									</>
								) : (
									"Complete Setup"
								)}
							</Button>
						</form>
					</CardContent>
				</Card>
			</main>
		</div>
	);
}
