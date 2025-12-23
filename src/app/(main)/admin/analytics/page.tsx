import { SystemActivityDashboard } from "@/widgets/system-activity";

export default function AdminAnalyticsPage() {
	return (
		<div className="p-6">
			<div>
				<h1 className="font-bold text-2xl text-foreground">System Activity</h1>
				<p className="text-muted-foreground text-sm">
					Review recent audit logs across the platform.
				</p>
			</div>

			<SystemActivityDashboard />
		</div>
	);
}
