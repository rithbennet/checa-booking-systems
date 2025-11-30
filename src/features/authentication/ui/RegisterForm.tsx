"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, GraduationCap, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { FcGoogle } from "react-icons/fc";
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

	useEffect(() => {
		if (email) {
			const detected = detectUserType(email);
			setUserType(detected);
		} else {
			setUserType(null);
		}
	}, [email]);

	const onSubmit = async (data: RegistrationFormData) => {
		setMessage(null);
		setError(null);

		const apiUserType = resolveApiUserType(userType);
		if (!apiUserType) {
			setError("Please enter a valid institutional or external email");
			return;
		}

		try {
			const res = await fetch("/api/auth/register", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					email: data.email,
					password: data.password,
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

							{userType === "institutional" && (
								<Card className="border-blue-200 bg-blue-50">
									<CardHeader className="pb-3">
										<CardTitle className="flex items-center text-lg">
											<GraduationCap className="mr-2 h-5 w-5 text-blue-600" />
											Institutional Details (MJIIT/UTM Member)
										</CardTitle>
									</CardHeader>
									<CardContent className="space-y-4">
										<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
											<div className="space-y-2">
												<Label htmlFor="faculty">Faculty *</Label>
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
														<SelectItem value="humanities">
															Malaysia Japanese Internation Institute of
															Technology
														</SelectItem>
													</SelectContent>
												</Select>
											</div>
											<div className="space-y-2">
												<Label htmlFor="department">Department *</Label>
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
											<Label htmlFor="matric">Matric Number / Staff ID *</Label>
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
											Organizational Details (External Member)
										</CardTitle>
									</CardHeader>
									<CardContent className="space-y-4">
										<div className="space-y-2">
											<Label htmlFor="company">
												Company/Institution Name *
											</Label>
											<Input
												className="h-11"
												id="company"
												placeholder="Enter your organization name"
											/>
										</div>
										<div className="space-y-2">
											<Label htmlFor="address">Organizational Address *</Label>
											<Textarea
												id="address"
												placeholder="Enter complete organizational address"
												rows={3}
											/>
										</div>
										<div className="space-y-2">
											<Label htmlFor="contact-person">
												Contact Person Details *
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
