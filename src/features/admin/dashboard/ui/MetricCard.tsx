import { Loader2, type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/shared/ui/shadcn/card";

interface MetricCardProps {
	label: string;
	value: string | number;
	icon: LucideIcon;
	color: string;
	bgColor: string;
	isLoading?: boolean;
}

export function MetricCard({
	label,
	value,
	icon: Icon,
	color,
	bgColor,
	isLoading = false,
}: MetricCardProps) {
	return (
		<Card>
			<CardContent className="p-6">
				{isLoading ? (
					<div className="flex items-center justify-center py-4">
						<Loader2 className="h-6 w-6 animate-spin text-gray-400" />
					</div>
				) : (
					<div className="flex items-center justify-between">
						<div>
							<p className="text-gray-600 text-sm">{label}</p>
							<p className={`font-bold text-3xl ${color}`}>{value}</p>
						</div>
						<div
							className={`flex h-12 w-12 items-center justify-center rounded-lg ${bgColor}`}
						>
							<Icon className={`h-6 w-6 ${color}`} />
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
