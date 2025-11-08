"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { authClient } from "@/shared/server/better-auth/client";

export default function SignOutPage() {
	const router = useRouter();
	useEffect(() => {
		// Trigger sign out and redirect to home
		authClient.signOut().then(() => {
			router.push("/");
		});
	}, [router]);

	return (
		<div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
			<div className="w-full max-w-md p-6">
				<div className="animate-pulse space-y-3">
					<div className="h-6 w-40 rounded bg-gray-200" />
					<div className="h-4 w-64 rounded bg-gray-200" />
					<div className="h-4 w-52 rounded bg-gray-200" />
				</div>
				<p className="sr-only">Signing you out...</p>
			</div>
		</div>
	);
}
