/**
 * Admin Financial Management Page
 *
 * Route: /admin/finance
 *
 * Provides a unified dashboard for managing financial operations:
 * - Overview: Per-booking financial status
 * - Forms: Service forms awaiting admin review
 * - Invoices: Invoice management
 * - Payments: Payment verification queue and history
 * - Results on Hold: Completed bookings with unpaid invoices
 */

import { FinanceDashboard } from "@/widgets/finance-dashboard";

export default function AdminFinancePage() {
    // Note: Admin role check is handled by the parent admin layout
    // See src/app/(main)/admin/layout.tsx

    return (
        <div className="space-y-6 p-6">
            <FinanceDashboard />
        </div>
    );
}
