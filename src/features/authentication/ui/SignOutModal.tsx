"use client";

import { Loader2, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
	const router = useRouter();
	const [isSigningOut, setIsSigningOut] = useState(false);
	const { clearPersistAndRehydrate } = useBookingWizardStore();

	useEffect(() => {
		if (!open || isSigningOut) return;

		let isActive = true;

		const run = async () => {
			setIsSigningOut(true);

			try {
				const session = await authClient.getSession();

				if (!isActive) return;

				const userId = session.data?.user?.id;

				// Clear local state first
				await clearPersistAndRehydrate();

				if (!isActive) return;

				if (userId) {
					await clearAllUserDrafts(userId);
				}

				if (!isActive) return;

				// Sign out with Better Auth - this will clear the session
				try {
					await authClient.signOut({
						fetchOptions: {
							onSuccess: () => {
								if (isActive) {
									router.push("/");
									router.refresh(); // Refresh to update server components
									onOpenChange?.(false);
								}
							},
						},
					});
				} catch (e) {
					console.error("[SignOutModal] signOut failed", e);
					// Even if sign-out fails, redirect to home
					if (isActive) {
						router.push("/");
						router.refresh();
						onOpenChange?.(false);
					}
				}
			} catch (e) {
				console.error("[SignOutModal] unexpected sign-out error", e);
				// On error, still try to redirect
				if (isActive) {
					router.push("/");
					router.refresh();
					onOpenChange?.(false);
				}
			} finally {
				if (isActive) {
					setIsSigningOut(false);
				}
			}
		};

		void run();

		return () => {
			// component closed/unmounted while async work in flight
			isActive = false;
		};
	}, [open, router, onOpenChange, clearPersistAndRehydrate, isSigningOut]);

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
