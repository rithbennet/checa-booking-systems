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
		if (!open || isSigningOut) return;

		let isActive = true;

		const run = async () => {
			setIsSigningOut(true);

			try {
				const session = await authClient.getSession();

				if (isActive) {
					const userId = session.data?.user?.id;

					await clearPersistAndRehydrate();

					if (isActive) {
						if (userId) {
							await clearAllUserDrafts(userId);
						}

						try {
							await authClient.signOut();
						} catch (e) {
							console.error("[SignOutModal] signOut failed, continuing", e);
						}

						if (isActive) {
							router.push("/");
							onOpenChange?.(false);
						}
					}
				}
			} catch (e) {
				console.error("[SignOutModal] unexpected sign-out error", e);
				// Optional: toast here
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
	}, [open, isSigningOut, router, onOpenChange, clearPersistAndRehydrate]);

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