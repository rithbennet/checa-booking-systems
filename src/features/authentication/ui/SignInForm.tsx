"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { FcGoogle } from "react-icons/fc";
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
import { login, loginWithGoogle } from "../lib/server-actions";
import { mapAuthError } from "../lib/utils";
import { type SignInFormData, signInSchema } from "../model/schemas";

interface SignInFormProps {
	error?: string;
}

export function SignInForm({ error }: SignInFormProps) {
	const errorMessage = mapAuthError(error);
	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<SignInFormData>({
		resolver: zodResolver(signInSchema),
	});

	const onSubmit = async (data: SignInFormData) => {
		const formData = new FormData();
		formData.append("email", data.email);
		formData.append("password", data.password);
		await login(formData);
	};

	return (
		<div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100">
			<main className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
				<Card className="shadow-lg">
					<CardHeader className="text-center">
						<CardTitle className="font-bold text-2xl text-gray-900">
							Sign in to your account
						</CardTitle>
						<CardDescription className="text-gray-600">
							Access the ChECA Lab Service Booking System
						</CardDescription>
					</CardHeader>
					<CardContent>
						{errorMessage ? (
							<div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-red-700 text-sm">
								{errorMessage}
							</div>
						) : null}

						<form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
							<div className="space-y-2">
								<Label
									className="font-medium text-gray-700 text-sm"
									htmlFor="email"
								>
									Email
								</Label>
								<Input
									autoComplete="email"
									className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
									id="email"
									type="email"
									{...register("email")}
									aria-invalid={errors.email ? "true" : "false"}
								/>
								{errors.email && (
									<p className="text-red-600 text-sm">{errors.email.message}</p>
								)}
							</div>
							<div className="space-y-2">
								<Label
									className="font-medium text-gray-700 text-sm"
									htmlFor="password"
								>
									Password
								</Label>
								<Input
									autoComplete="current-password"
									className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
									id="password"
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
							<Button
								className="h-12 w-full bg-blue-600 text-base hover:bg-blue-700"
								disabled={isSubmitting}
								type="submit"
							>
								{isSubmitting ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Signing in...
									</>
								) : (
									"Sign in"
								)}
							</Button>
						</form>

						<div className="relative my-6">
							<div className="absolute inset-0 flex items-center">
								<span className="w-full border-gray-200 border-t" />
							</div>
							<div className="relative flex justify-center text-xs uppercase">
								<span className="bg-white px-2 text-gray-500">or</span>
							</div>
						</div>

						<form action={loginWithGoogle}>
							<Button
								className="h-12 w-full border-gray-300 text-base transition-colors hover:border-blue-400 hover:bg-blue-50"
								type="submit"
								variant="outline"
							>
								<FcGoogle />
								Sign in with Google
							</Button>
						</form>
					</CardContent>
				</Card>
			</main>
		</div>
	);
}
