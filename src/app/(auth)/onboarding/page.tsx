import { redirect } from "next/navigation";
import { OnboardingWizard } from "@/features/authentication";
import { auth } from "@/shared/server/auth";

export default async function OnboardingPage() {
	const session = await auth();

	// If not logged in, redirect to sign in
	if (!session?.user) {
		redirect("/signIn");
	}

	// If user already has an app profile, redirect to dashboard
	// Check if they have appUserId (meaning User record exists)
	const user = session.user as {
		appUserId?: string | null;
		needsOnboarding?: boolean;
	};
	if (user.appUserId && !user.needsOnboarding) {
		redirect("/dashboard");
	}

	return (
		<OnboardingWizard
			email={session.user.email}
			image={session.user.image ?? undefined}
			name={session.user.name ?? undefined}
		/>
	);
}
