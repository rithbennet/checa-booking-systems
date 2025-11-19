import { redirect } from "next/navigation";
import { OperationsPageClient } from "@/features/operations";
import { requireCurrentUser } from "@/shared/server/current-user";

export default async function OperationsPage() {
	const currentUser = await requireCurrentUser();

	// Admin-only guard
	if (currentUser.role !== "lab_administrator") {
		redirect("/admin");
	}

	return (
		<div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
			<div className="mb-6 flex items-center justify-between">
				<div>
					<h1 className="font-bold text-2xl text-gray-900">Operations</h1>
					<p className="mt-1 text-gray-600 text-sm">
						Manage samples and workspace schedules
					</p>
				</div>
			</div>

			<OperationsPageClient />
		</div>
	);
}
