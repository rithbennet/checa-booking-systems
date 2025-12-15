"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, GraduationCap, Loader2, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { FcGoogle } from "react-icons/fc";
import { useRegistrationOptions } from "@/entities/user";
import { authClient } from "@/shared/server/better-auth/client";
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
import { detectUserType, resolveApiUserType } from "../lib/utils";
import {
	type RegistrationFormData,
	registrationSchema,
} from "../model/schemas";
import type { UserType } from "../model/types";

export function RegisterForm() {
	const router = useRouter();
	const [message, setMessage] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [userType, setUserType] = useState<UserType>(null);

	// Fetch dropdown options from database
	const { data: options, isLoading: optionsLoading } = useRegistrationOptions();

	const {
		register,
		handleSubmit,
		watch,
		setValue,
		formState: { errors, isSubmitting },
	} = useForm<RegistrationFormData>({
		resolver: zodResolver(registrationSchema),
		defaultValues: {
			acceptedTerms: false,
		},
	});

	const email = watch("email");
	const facultyId = watch("facultyId");
	const academicType = watch("academicType");
	const companyId = watch("companyId");
	const companyBranchId = watch("companyBranchId");

	useEffect(() => {
		if (email) {
			const detected = detectUserType(email);
			setUserType(detected);
		} else {
			setUserType(null);
		}
	}, [email]);

	// Determine if selected faculty is MJIIT
	const selectedFaculty = options?.faculties.find((f) => f.id === facultyId);
	const isMjiit = selectedFaculty?.isMjiit ?? false;

	// Filter departments/ikohzas by selected faculty
	const filteredDepartments = useMemo(() => {
		if (!options?.departments || !facultyId) return [];
		return options.departments.filter((d) => d.facultyId === facultyId);
	}, [options?.departments, facultyId]);

	const filteredIkohzas = useMemo(() => {
		if (!options?.ikohzas || !facultyId) return [];
		return options.ikohzas.filter((i) => i.facultyId === facultyId);
	}, [options?.ikohzas, facultyId]);

	// Filter branches by selected company
	const filteredBranches = useMemo(() => {
		if (!options?.companyBranches || !companyId) return [];
		return options.companyBranches.filter((b) => b.companyId === companyId);
	}, [options?.companyBranches, companyId]);

	// Handle company change - reset branch
	const handleCompanyChange = (value: string) => {
		if (value === "new") {
			setValue("companyId", "");
			setValue("companyBranchId", "");
			setValue("newBranchName", "");
			setValue("newBranchAddress", "");
		} else {
			setValue("companyId", value);
			setValue("companyBranchId", "");
			setValue("newCompanyName", "");
			setValue("newCompanyAddress", "");
			setValue("newCompanyBranchName", "");
			setValue("newBranchName", "");
			setValue("newBranchAddress", "");
		}
	};

	// Handle branch change - support adding new branch
	const handleBranchChange = (value: string) => {
		if (value === "new") {
			setValue("companyBranchId", "");
		} else {
			setValue("companyBranchId", value);
			setValue("newBranchName", "");
			setValue("newBranchAddress", "");
		}
	};

	const onSubmit = async (data: RegistrationFormData) => {
		setMessage(null);
		setError(null);

		const apiUserType = resolveApiUserType(userType);
		if (!apiUserType) {
			setError("Please enter a valid institutional or external email");
			return;
		}

		try {
			const payload: Record<string, unknown> = {
				email: data.email,
				password: data.password,
				firstName: data.firstName.trim(),
				lastName: data.lastName.trim(),
				userType: apiUserType,
				phone: data.phone?.trim() || undefined,
			};

			// Add institutional fields if internal user
			// Note: Server will determine if it's mjiit_member based on faculty selection
			if (apiUserType === "utm_member") {
				if (data.facultyId) payload.facultyId = data.facultyId;
				if (data.departmentId) payload.departmentId = data.departmentId;
				if (data.ikohzaId) payload.ikohzaId = data.ikohzaId;
				if (data.academicType) payload.academicType = data.academicType;
				if (data.userIdentifier)
					payload.userIdentifier = data.userIdentifier.trim();
				if (data.supervisorName)
					payload.supervisorName = data.supervisorName.trim();
			}

			// Add external fields if external user
			if (apiUserType === "external_member") {
				if (data.companyId) {
					payload.companyId = data.companyId;
					if (data.companyBranchId) {
						payload.companyBranchId = data.companyBranchId;
					} else if (data.newBranchName) {
						// Adding new branch to existing company
						payload.newBranchName = data.newBranchName.trim();
						payload.newBranchAddress = data.newBranchAddress?.trim();
					}
				} else if (data.newCompanyName) {
					payload.newCompanyName = data.newCompanyName.trim();
					payload.newCompanyAddress = data.newCompanyAddress?.trim();
					if (data.newCompanyBranchName) {
						payload.newCompanyBranchName = data.newCompanyBranchName.trim();
					}
				}
			}

			const res = await fetch("/api/auth/register", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});

			const responseData = (await res.json().catch(() => ({}))) as {
				message?: string;
				error?: string;
			};
			if (!res.ok) {
				setError(responseData?.error ?? "Registration failed");
				return;
			}
			// Auto sign-in (status may be pending, but access allowed with limited actions)
			try {
				await authClient.signIn.email({
					email: data.email,
					password: data.password,
				});
				router.push("/dashboard");
			} catch {
				setMessage(responseData?.message ?? "Account created. Please sign in.");
			}
		} catch {
			setError("Unexpected error. Please try again.");
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
						<CardTitle className="font-bold text-2xl text-gray-900">
							Create Your Account
						</CardTitle>
						<CardDescription className="text-gray-600">
							Register for ChECA Lab Service Booking System
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-6">
						<div className="space-y-4">
							<Button
								className="h-12 w-full border-gray-300 text-base transition-colors hover:border-blue-400 hover:bg-blue-50"
								onClick={async () => {
									await authClient.signIn.social({
										provider: "google",
										callbackURL: "/dashboard",
										newUserCallbackURL: "/onboarding",
									});
								}}
								variant="outline"
							>
								<FcGoogle />
								Sign up with Google
							</Button>

							<div className="relative">
								<div className="absolute inset-0 flex items-center">
									<span className="w-full border-gray-300 border-t" />
								</div>
								<div className="relative flex justify-center text-sm">
									<span className="bg-white px-4 text-gray-500">OR</span>
								</div>
							</div>
						</div>

						<form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
							<h3 className="font-medium text-gray-900 text-lg">
								Register with Email
							</h3>

							<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
								<div className="space-y-2">
									<Label
										className="font-medium text-gray-700 text-sm"
										htmlFor="first-name"
									>
										First Name <span className="text-red-500">*</span>
									</Label>
									<Input
										className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
										id="first-name"
										placeholder="Enter your first name"
										{...register("firstName")}
										aria-invalid={errors.firstName ? "true" : "false"}
									/>
									{errors.firstName && (
										<p className="text-red-600 text-sm">
											{errors.firstName.message}
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
										className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
										id="last-name"
										placeholder="Enter your last name"
										{...register("lastName")}
										aria-invalid={errors.lastName ? "true" : "false"}
									/>
									{errors.lastName && (
										<p className="text-red-600 text-sm">
											{errors.lastName.message}
										</p>
									)}
								</div>
							</div>

							<div className="space-y-2">
								<Label
									className="font-medium text-gray-700 text-sm"
									htmlFor="email"
								>
									Email Address <span className="text-red-500">*</span>
								</Label>
								<Input
									className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
									id="email"
									placeholder="Enter your email address"
									type="email"
									{...register("email")}
									aria-invalid={errors.email ? "true" : "false"}
								/>
								{errors.email ? (
									<p className="text-red-600 text-sm">{errors.email.message}</p>
								) : email &&
									(email.includes("@utm.my") ||
										email.includes("@graduate.utm.my")) ? (
									<p className="flex items-center text-green-600 text-xs">
										<span className="mr-1">✓</span>
										Recognized as UTM/MJIIT institutional email
									</p>
								) : null}
							</div>

							<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
								<div className="space-y-2">
									<Label
										className="font-medium text-gray-700 text-sm"
										htmlFor="password"
									>
										Password <span className="text-red-500">*</span>
									</Label>
									<Input
										className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
										id="password"
										placeholder="Create a strong password"
										type="password"
										{...register("password")}
										aria-invalid={errors.password ? "true" : "false"}
									/>
									{errors.password && (
										<p className="text-red-600 text-sm">
											{errors.password.message}
										</p>
									)}
								</div>
								<div className="space-y-2">
									<Label
										className="font-medium text-gray-700 text-sm"
										htmlFor="confirm-password"
									>
										Confirm Password <span className="text-red-500">*</span>
									</Label>
									<Input
										className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
										id="confirm-password"
										placeholder="Confirm your password"
										type="password"
										{...register("confirmPassword")}
										aria-invalid={errors.confirmPassword ? "true" : "false"}
									/>
									{errors.confirmPassword && (
										<p className="text-red-600 text-sm">
											{errors.confirmPassword.message}
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
									className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
									id="phone"
									placeholder="Enter your phone number"
									type="tel"
									{...register("phone")}
									aria-invalid={errors.phone ? "true" : "false"}
								/>
								{errors.phone && (
									<p className="text-red-600 text-sm">{errors.phone.message}</p>
								)}
							</div>

							{/* Institutional User Form */}
							{userType === "institutional" && (
								<Card className="border-blue-200 bg-blue-50">
									<CardHeader className="pb-3">
										<CardTitle className="flex items-center text-lg">
											<GraduationCap className="mr-2 h-5 w-5 text-blue-600" />
											Institutional Details (MJIIT/UTM Member)
										</CardTitle>
									</CardHeader>
									<CardContent className="space-y-4">
										{/* Faculty Selection */}
										<div className="space-y-2">
											<Label htmlFor="faculty">
												Faculty <span className="text-red-500">*</span>
											</Label>
											<Select
												onValueChange={(value) => {
													setValue("facultyId", value);
													setValue("departmentId", "");
													setValue("ikohzaId", "");
												}}
												value={facultyId || ""}
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
											{errors.facultyId && (
												<p className="text-red-600 text-sm">
													{errors.facultyId.message}
												</p>
											)}
										</div>

										{/* Department (required for all faculties) */}
										{facultyId && (
											<div className="space-y-2">
												<Label htmlFor="department">
													Department <span className="text-red-500">*</span>
												</Label>
												<Select
													onValueChange={(value) =>
														setValue("departmentId", value)
													}
													value={watch("departmentId") || ""}
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
												{errors.departmentId && (
													<p className="text-red-600 text-sm">
														{errors.departmentId.message}
													</p>
												)}
											</div>
										)}

										{/* iKohza (required for MJIIT only) */}
										{isMjiit && facultyId && (
											<div className="space-y-2">
												<Label htmlFor="ikohza">
													iKohza <span className="text-red-500">*</span>
												</Label>
												<Select
													onValueChange={(value) => setValue("ikohzaId", value)}
													value={watch("ikohzaId") || ""}
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
												{errors.ikohzaId && (
													<p className="text-red-600 text-sm">
														{errors.ikohzaId.message}
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
														academicType === "student"
															? "border-blue-500 bg-blue-50 text-blue-700"
															: "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
													}`}
													onClick={() => setValue("academicType", "student")}
													type="button"
												>
													<GraduationCap className="h-5 w-5" />
													<span className="font-medium">Student</span>
												</button>
												<button
													className={`flex items-center justify-center gap-2 rounded-lg border-2 p-4 transition-colors ${
														academicType === "staff"
															? "border-blue-500 bg-blue-50 text-blue-700"
															: "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
													}`}
													onClick={() => setValue("academicType", "staff")}
													type="button"
												>
													<User className="h-5 w-5" />
													<span className="font-medium">Staff</span>
												</button>
											</div>
											{errors.academicType && (
												<p className="text-red-600 text-sm">
													{errors.academicType.message}
												</p>
											)}
										</div>

										{/* Matric / Staff ID */}
										<div className="space-y-2">
											<Label htmlFor="userIdentifier">
												{academicType === "student"
													? "Matric Number"
													: "Staff ID"}{" "}
												<span className="text-red-500">*</span>
											</Label>
											<Input
												className="h-11"
												id="userIdentifier"
												placeholder={
													academicType === "student"
														? "Enter your Matric Number"
														: "Enter your Staff ID"
												}
												{...register("userIdentifier")}
											/>
											{errors.userIdentifier && (
												<p className="text-red-600 text-sm">
													{errors.userIdentifier.message}
												</p>
											)}
										</div>

										{/* Supervisor Name (for students) */}
										{academicType === "student" && (
											<div className="space-y-2">
												<Label htmlFor="supervisorName">
													Supervisor Name{" "}
													<span className="text-red-500">*</span>
												</Label>
												<Input
													className="h-11"
													id="supervisorName"
													placeholder="Enter your supervisor's name"
													{...register("supervisorName")}
												/>
												{errors.supervisorName && (
													<p className="text-red-600 text-sm">
														{errors.supervisorName.message}
													</p>
												)}
											</div>
										)}
									</CardContent>
								</Card>
							)}

							{/* External User Form */}
							{userType === "external" && (
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
												value={companyId || "new"}
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
										{!companyId && (
											<>
												<div className="space-y-2">
													<Label htmlFor="newCompanyName">
														Company Name <span className="text-red-500">*</span>
													</Label>
													<Input
														className="h-11"
														id="newCompanyName"
														placeholder="Enter your company name"
														{...register("newCompanyName")}
													/>
													{errors.newCompanyName && (
														<p className="text-red-600 text-sm">
															{errors.newCompanyName.message}
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
														placeholder="e.g., Main Office, Headquarters, KL Branch"
														{...register("newCompanyBranchName")}
													/>
													{errors.newCompanyBranchName && (
														<p className="text-red-600 text-sm">
															{errors.newCompanyBranchName.message}
														</p>
													)}
												</div>
												<div className="space-y-2">
													<Label htmlFor="newCompanyAddress">
														Branch Address{" "}
														<span className="text-red-500">*</span>
													</Label>
													<Textarea
														id="newCompanyAddress"
														placeholder="Enter complete branch address (required)"
														rows={3}
														{...register("newCompanyAddress")}
													/>
													{errors.newCompanyAddress && (
														<p className="text-red-600 text-sm">
															{errors.newCompanyAddress.message}
														</p>
													)}
												</div>
											</>
										)}

										{/* Branch Selection (if company selected) */}
										{companyId && (
											<>
												<div className="space-y-2">
													<Label htmlFor="branch">Branch</Label>
													<Select
														onValueChange={handleBranchChange}
														value={companyBranchId || "new"}
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
												{!companyBranchId && (
													<>
														<div className="space-y-2">
															<Label htmlFor="newBranchName">
																Branch Name{" "}
																<span className="text-red-500">*</span>
															</Label>
															<Input
																className="h-11"
																id="newBranchName"
																placeholder="e.g., Main Office, KL Branch"
																{...register("newBranchName")}
															/>
															{errors.newBranchName && (
																<p className="text-red-600 text-sm">
																	{errors.newBranchName.message}
																</p>
															)}
														</div>
														<div className="space-y-2">
															<Label htmlFor="newBranchAddress">
																Branch Address{" "}
																<span className="text-red-500">*</span>
															</Label>
															<Textarea
																id="newBranchAddress"
																placeholder="Enter complete branch address (required)"
																rows={2}
																{...register("newBranchAddress")}
															/>
															{errors.newBranchAddress && (
																<p className="text-red-600 text-sm">
																	{errors.newBranchAddress.message}
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

							<div className="space-y-2">
								<div className="flex items-center space-x-2">
									<Checkbox
										aria-invalid={errors.acceptedTerms ? "true" : "false"}
										checked={watch("acceptedTerms")}
										id="terms"
										onCheckedChange={(checked) =>
											setValue("acceptedTerms", checked === true)
										}
									/>
									<Label className="text-sm" htmlFor="terms">
										I agree to the{" "}
										<a
											className="text-blue-600 hover:text-blue-800"
											href="/terms"
										>
											Terms & Conditions
										</a>{" "}
										and{" "}
										<a
											className="text-blue-600 hover:text-blue-800"
											href="/privacy"
										>
											Privacy Policy
										</a>
									</Label>
								</div>
								{errors.acceptedTerms && (
									<p className="text-red-600 text-sm">
										{errors.acceptedTerms.message}
									</p>
								)}
							</div>

							{error && <p className="text-red-600 text-sm">{error}</p>}
							{message && <p className="text-green-700 text-sm">{message}</p>}

							<Button
								className="h-12 w-full bg-blue-600 text-base hover:bg-blue-700"
								disabled={isSubmitting}
								type="submit"
							>
								{isSubmitting ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Creating account...
									</>
								) : (
									"Register Account"
								)}
							</Button>
						</form>
					</CardContent>
				</Card>
			</main>
		</div>
	);
}
