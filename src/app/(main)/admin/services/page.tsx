/**
 * Admin Services Management Page
 *
 * Route: /admin/services
 */

import { AdminServiceManagementDashboard } from "@/widgets/admin-service-management";

export default function AdminServicesPage() {
	// Note: Admin role check is handled by the parent admin layout
	// See src/app/(main)/admin/layout.tsx

	return (
		<div className="space-y-6 p-6">
			<AdminServiceManagementDashboard />
		</div>
	);
}
