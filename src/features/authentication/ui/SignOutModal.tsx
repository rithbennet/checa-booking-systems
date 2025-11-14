"use client";

import { Loader2, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clearAllUserDrafts } from "@/entities/booking/lib/draftService";
import { useBookingWizardStore } from "@/features/booking-form/model/use-booking-wizard-store";
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
	const router = useRouter();
	const [isSigningOut, setIsSigningOut] = useState(false);
	const { clearPersistAndRehydrate } = useBookingWizardStore();

	useEffect(() => {
		if (open && !isSigningOut) {
			setIsSigningOut(true);

			// Get current user session to clear their drafts
			authClient.getSession().then(async (session) => {
				const userId = session.data?.user?.id;

				// Clear booking wizard state and drafts
				await clearPersistAndRehydrate();

				if (userId) {
					clearAllUserDrafts(userId);
				}

				// Sign out and redirect
				authClient
					.signOut()
					.then(() => {
						router.push("/");
					})
					.catch(() => {
						// Even if signout fails, redirect
						router.push("/");
					})
					.finally(() => {
						setIsSigningOut(false);
						onOpenChange?.(false);
					});
			});
		}
	}, [open, router, isSigningOut, onOpenChange, clearPersistAndRehydrate]);

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
						Signing you out...
					</DialogTitle>
					<DialogDescription className="pt-2 text-center">
						Please wait while we securely sign you out of your account.
					</DialogDescription>
				</DialogHeader>
				<div className="flex items-center justify-center py-4">
					<Loader2 className="h-6 w-6 animate-spin text-blue-600" />
				</div>
			</DialogContent>
		</Dialog>
	);
}
