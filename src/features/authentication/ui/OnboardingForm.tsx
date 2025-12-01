"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, GraduationCap, Loader2, User } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
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
import type { UserType } from "../model/types";

const onboardingSchema = z.object({
	firstName: z.string().min(1, "First name is required").trim(),
	lastName: z.string().min(1, "Last name is required").trim(),
	acceptedTerms: z.boolean().refine((val) => val === true, {
		message: "You must accept the Terms & Privacy",
	}),
});

type OnboardingFormData = z.infer<typeof onboardingSchema>;

interface OnboardingFormProps {
	email: string;
	name?: string;
	image?: string;
}

export function OnboardingForm({ email, name, image }: OnboardingFormProps) {
	const router = useRouter();
	const [error, setError] = useState<string | null>(null);
	const [userType, setUserType] = useState<UserType>(null);

	// Parse name from OAuth provider (usually "First Last")
	const nameParts = name?.trim().split(" ") ?? [];
	const defaultFirstName = nameParts[0] ?? "";
	const defaultLastName = nameParts.slice(1).join(" ") ?? "";

	const {
		register,
		handleSubmit,
		watch,
		setValue,
		formState: { errors, isSubmitting },
	} = useForm<OnboardingFormData>({
		resolver: zodResolver(onboardingSchema),
		defaultValues: {
			firstName: defaultFirstName,
			lastName: defaultLastName,
			acceptedTerms: false,
		},
	});

	// Detect user type based on email domain
	useEffect(() => {
		if (email) {
			const detected = detectUserType(email);
			setUserType(detected);
		}
	}, [email]);

	const onSubmit = async (data: OnboardingFormData) => {
		setError(null);

		const apiUserType = resolveApiUserType(userType);
		if (!apiUserType) {
			setError("Unable to determine user type from email");
			return;
		}

		try {
			const res = await fetch("/api/auth/complete-onboarding", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					firstName: data.firstName.trim(),
					lastName: data.lastName.trim(),
					userType: apiUserType,
				}),
			});

			const responseData = (await res.json().catch(() => ({}))) as {
				message?: string;
				error?: string;
			};

			if (!res.ok) {
				setError(responseData?.error ?? "Failed to complete onboarding");
				return;
			}

			// Redirect to dashboard after successful onboarding
			router.push("/dashboard");
			router.refresh(); // Refresh to update session data
		} catch {
			setError("Unexpected error. Please try again.");
		}
	};

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

						<form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
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
								{email &&
									(email.includes("@utm.my") ||
										email.includes("@graduate.utm.my")) && (
										<p className="flex items-center text-green-600 text-xs">
											<span className="mr-1">✓</span>
											Recognized as UTM/MJIIT institutional email
										</p>
									)}
							</div>

							{userType === "institutional" && (
								<Card className="border-blue-200 bg-blue-50">
									<CardHeader className="pb-3">
										<CardTitle className="flex items-center text-lg">
											<GraduationCap className="mr-2 h-5 w-5 text-blue-600" />
											Institutional Member (MJIIT/UTM)
										</CardTitle>
									</CardHeader>
									<CardContent className="space-y-4">
										<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
											<div className="space-y-2">
												<Label htmlFor="faculty">Faculty</Label>
												<Select>
													<SelectTrigger>
														<SelectValue placeholder="Select Faculty" />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="engineering">
															Faculty of Engineering
														</SelectItem>
														<SelectItem value="science">
															Faculty of Science
														</SelectItem>
														<SelectItem value="management">
															Faculty of Management
														</SelectItem>
														<SelectItem value="computing">
															Faculty of Computing
														</SelectItem>
														<SelectItem value="mjiit">
															Malaysia-Japan International Institute of
															Technology
														</SelectItem>
													</SelectContent>
												</Select>
											</div>
											<div className="space-y-2">
												<Label htmlFor="department">Department</Label>
												<Select>
													<SelectTrigger>
														<SelectValue placeholder="Select Department" />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="chemical">
															Chemical Engineering
														</SelectItem>
														<SelectItem value="mechanical">
															Mechanical Engineering
														</SelectItem>
														<SelectItem value="electrical">
															Electrical Engineering
														</SelectItem>
														<SelectItem value="civil">
															Civil Engineering
														</SelectItem>
													</SelectContent>
												</Select>
											</div>
										</div>
										<div className="space-y-2">
											<Label htmlFor="matric">Matric Number / Staff ID</Label>
											<Input
												className="h-11"
												id="matric"
												placeholder="Enter your Matric Number or Staff ID"
											/>
										</div>
									</CardContent>
								</Card>
							)}

							{userType === "external" && (
								<Card className="border-orange-200 bg-orange-50">
									<CardHeader className="pb-3">
										<CardTitle className="flex items-center text-lg">
											<Building2 className="mr-2 h-5 w-5 text-orange-600" />
											External Member
										</CardTitle>
									</CardHeader>
									<CardContent className="space-y-4">
										<div className="space-y-2">
											<Label htmlFor="company">Company/Institution Name</Label>
											<Input
												className="h-11"
												id="company"
												placeholder="Enter your organization name"
											/>
										</div>
										<div className="space-y-2">
											<Label htmlFor="address">Organizational Address</Label>
											<Textarea
												id="address"
												placeholder="Enter complete organizational address"
												rows={3}
											/>
										</div>
										<div className="space-y-2">
											<Label htmlFor="contact-person">
												Contact Person Details
											</Label>
											<Input
												className="h-11"
												id="contact-person"
												placeholder="Contact person name and designation"
											/>
										</div>
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
