import { redirect } from "next/navigation";
import { requireCurrentUser } from "@/shared/server/current-user";

export default async function AdminLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const currentUser = await requireCurrentUser();

	// Admin-only guard - protect all admin pages
	if (currentUser.role !== "lab_administrator") {
		redirect("/dashboard");
	}

	return <>{children}</>;
}
