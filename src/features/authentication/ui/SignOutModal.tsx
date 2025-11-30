"use client";

import { Loader2, LogOut } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { clearAllUserDrafts } from "@/entities/booking/lib/draftService";
import { useBookingWizardStore } from "@/features/bookings/form/model/use-booking-wizard-store";
import { authClient } from "@/shared/server/better-auth/client";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/shared/ui/shadcn/dialog";

interface SignOutModalProps {
	open: boolean;
	onOpenChange?: (open: boolean) => void;
}

export function SignOutModal({ open, onOpenChange }: SignOutModalProps) {
	const hasStartedSignOut = useRef(false);
	const [status, setStatus] = useState<"loading" | "error">("loading");
	const { clearPersistAndRehydrate } = useBookingWizardStore();

	// Stable redirect function using window.location for a hard redirect
	const performRedirect = useCallback(() => {
		// Use window.location for a hard redirect to ensure all state is cleared
		window.location.href = "/";
	}, []);

	// Reset the ref when modal closes
	useEffect(() => {
		if (!open) {
			hasStartedSignOut.current = false;
			setStatus("loading");
		}
	}, [open]);

	useEffect(() => {
		// Only run once when modal opens
		if (!open || hasStartedSignOut.current) return;

		hasStartedSignOut.current = true;

		const run = async () => {
			try {
				const session = await authClient.getSession();
				const userId = session.data?.user?.id;

				// Clear local state first
				await clearPersistAndRehydrate();

				if (userId) {
					await clearAllUserDrafts(userId);
				}

				// Sign out with Better Auth
				const result = await authClient.signOut();

				// Check if sign-out was successful
				if (result.error) {
					console.error("[SignOutModal] sign-out returned error", result.error);
					setStatus("error");
					// Still redirect after a short delay even on error
					setTimeout(performRedirect, 1500);
					return;
				}

				// Success - redirect
				performRedirect();
			} catch (e) {
				console.error("[SignOutModal] sign-out error", e);
				setStatus("error");
				// Even if sign-out fails, redirect after a short delay
				setTimeout(performRedirect, 1500);
			}
		};

		void run();
	}, [open, clearPersistAndRehydrate, performRedirect]);

	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
			<DialogContent className="sm:max-w-md" showCloseButton={false}>
				<DialogHeader>
					<div className="mb-4 flex items-center justify-center">
						<div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
							<LogOut className="h-8 w-8 animate-pulse text-blue-600" />
						</div>
					</div>
					<DialogTitle className="text-center text-xl">
						{status === "error" ? "Sign out issue" : "Signing you out..."}
					</DialogTitle>
					<DialogDescription className="pt-2 text-center">
						{status === "error"
							? "There was an issue signing out. Redirecting you to the home page..."
							: "Please wait while we securely sign you out of your account."}
					</DialogDescription>
				</DialogHeader>
				<div className="flex items-center justify-center py-4">
					<Loader2 className="h-6 w-6 animate-spin text-blue-600" />
				</div>
			</DialogContent>
		</Dialog>
	);
}
