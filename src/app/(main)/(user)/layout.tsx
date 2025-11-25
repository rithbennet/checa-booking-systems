import { redirect } from "next/navigation";
import { requireCurrentUser } from "@/shared/server/current-user";

export default async function layout({
	children,
}: {
	children: React.ReactNode;
}) {
	const currentUser = await requireCurrentUser();

	if (currentUser.role === "lab_administrator") {
		redirect("/admin");
	}

	return <>{children}</>;
}
