import { OperationsPageClient } from "@/features/operations";

export default async function OperationsPage() {
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
