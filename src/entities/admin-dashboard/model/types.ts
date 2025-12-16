/**
 * Admin Dashboard Entity Types
 * View models for the admin dashboard page
 */

export interface AdminDashboardMetricsVM {
	pendingVerifications: number;
	pendingApprovals: number;
	overduePayments: number;
	activeBookings: number;
	completedThisMonth: number;
	totalRevenue: number;
}

export interface AdminDashboardStatusVM {
	bookingsByStatus: {
		pending: number;
		approved: number;
		inProgress: number;
		completed: number;
	};
	usersByType: {
		mjiit: number;
		utm: number;
		external: number;
		pending: number;
	};
	activeSamples: number;
}

export interface AdminDashboardActivityItemVM {
	id: string;
	action: string;
	timestamp: string;
	type: "user" | "booking" | "payment" | "sample" | "service";
}

export interface AdminDashboardActivityVM {
	items: AdminDashboardActivityItemVM[];
}
