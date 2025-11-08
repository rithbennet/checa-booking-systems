"use client";

import { Building2, GraduationCap } from "lucide-react";
import { useRouter } from "next/navigation";
import type React from "react";
import { useState } from "react";
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

export default function RegistrationPage() {
	const router = useRouter();
	const [email, setEmail] = useState("");
	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [acceptedTerms, setAcceptedTerms] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [message, setMessage] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [userType, setUserType] = useState<"institutional" | "external" | null>(
		null,
	);

	const detectUserType = (emailValue: string) => {
		if (
			emailValue.includes("@utm.my") ||
			emailValue.includes("@graduate.utm.my")
		) {
			setUserType("institutional");
		} else if (
			emailValue &&
			!emailValue.includes("@utm.my") &&
			!emailValue.includes("@graduate.utm.my")
		) {
			setUserType("external");
		} else {
			setUserType(null);
		}
	};

	const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		setEmail(value);
		detectUserType(value);
	};

	const resolveApiUserType = () => {
		if (userType === "institutional") return "utm_member" as const;
		if (userType === "external") return "external_member" as const;
		return null;
	};

	const validate = () => {
		if (!email) return "Email is required";
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Enter a valid email";
		if (!firstName.trim()) return "First name is required";
		if (!lastName.trim()) return "Last name is required";
		if (password.length < 8) return "Password must be at least 8 characters";
		if (password !== confirmPassword) return "Passwords do not match";
		if (!acceptedTerms) return "You must accept the Terms & Privacy";
		const apiType = resolveApiUserType();
		if (!apiType) return "Please enter a valid institutional or external email";
		return null;
	};

	const onSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setMessage(null);
		setError(null);
		const validationError = validate();
		if (validationError) {
			setError(validationError);
			return;
		}

		const apiUserType = resolveApiUserType();
		if (!apiUserType) return;

		try {
			setSubmitting(true);
			const res = await fetch("/api/auth/register", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					email,
					password,
					firstName: firstName.trim(),
					lastName: lastName.trim(),
					userType: apiUserType,
				}),
			});

			const data = (await res.json().catch(() => ({}))) as {
				message?: string;
				error?: string;
			};
			if (!res.ok) {
				setError(data?.error ?? "Registration failed");
				return;
			}
			// Auto sign-in (status may be pending, but access allowed with limited actions)
			try {
				await authClient.signIn.email({ email, password });
				router.push("/dashboard");
			} catch {
				setMessage(data?.message ?? "Account created. Please sign in.");
			}
		} catch {
			setError("Unexpected error. Please try again.");
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
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
									});
								}}
								variant="outline"
							>
								<svg
									aria-label="Google"
									className="mr-3 h-5 w-5"
									viewBox="0 0 24 24"
								>
									<title>Google</title>
									<path
										d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
										fill="#4285F4"
									/>
									<path
										d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
										fill="#34A853"
									/>
									<path
										d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
										fill="#FBBC05"
									/>
									<path
										d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
										fill="#EA4335"
									/>
								</svg>
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

						<form className="space-y-4" onSubmit={onSubmit}>
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
										onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
											setFirstName(e.target.value)
										}
										placeholder="Enter your first name"
										value={firstName}
									/>
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
										onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
											setLastName(e.target.value)
										}
										placeholder="Enter your last name"
										value={lastName}
									/>
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
									onChange={handleEmailChange}
									placeholder="Enter your email address"
									type="email"
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
										onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
											setPassword(e.target.value)
										}
										placeholder="Create a strong password"
										type="password"
										value={password}
									/>
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
										onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
											setConfirmPassword(e.target.value)
										}
										placeholder="Confirm your password"
										type="password"
										value={confirmPassword}
									/>
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

							<div className="flex items-center space-x-2">
								<Checkbox
									checked={acceptedTerms}
									id="terms"
									onCheckedChange={(v) => setAcceptedTerms(Boolean(v))}
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

							{error && <p className="text-red-600 text-sm">{error}</p>}
							{message && <p className="text-green-700 text-sm">{message}</p>}

							<Button
								className="h-12 w-full bg-blue-600 text-base hover:bg-blue-700"
								disabled={submitting}
								type="submit"
							>
								{submitting ? "Creating account..." : "Register Account"}
							</Button>
						</form>
					</CardContent>
				</Card>
			</main>
		</div>
	);
}
