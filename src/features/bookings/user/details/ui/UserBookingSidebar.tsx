/**
 * UserBookingSidebar Component
 *
 * Sidebar with payment summary, documents, and project info.
 */

"use client";

import { CheckCircle, Clock, CreditCard, Lock } from "lucide-react";
import type { UserBookingDetailVM } from "@/entities/booking/model/user-detail-types";
import { Button } from "@/shared/ui/shadcn/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/shared/ui/shadcn/card";
import { formatCurrency } from "../lib/helpers";

interface UserBookingSidebarProps {
	booking: UserBookingDetailVM;
}

export function UserBookingSidebar({ booking }: UserBookingSidebarProps) {
	const totalAmount = Number.parseFloat(booking.totalAmount);
	const paidAmount = Number.parseFloat(booking.paidAmount);
	const remainingAmount = totalAmount - paidAmount;

	return (
		<div className="space-y-6">
			{/* Payment Summary */}
			<Card>
				<CardHeader className="pb-2">
					<CardTitle className="flex items-center gap-2 text-base">
						<CreditCard className="h-4 w-4 text-slate-400" />
						Payment Summary
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<span className="text-slate-500 text-sm">Total Amount</span>
							<span className="font-bold text-slate-900">
								{formatCurrency(totalAmount)}
							</span>
						</div>
						<div className="flex items-center justify-between">
							<span className="text-slate-500 text-sm">Paid</span>
							<span className="font-medium text-green-600">
								{formatCurrency(paidAmount)}
							</span>
						</div>
						{remainingAmount > 0 && (
							<div className="flex items-center justify-between border-slate-200 border-t pt-2">
								<span className="font-medium text-slate-700 text-sm">
									Remaining
								</span>
								<span className="font-bold text-orange-600">
									{formatCurrency(remainingAmount)}
								</span>
							</div>
						)}
					</div>

					{/* Payment Status */}
					<div className="rounded-lg border p-3">
						{booking.isPaid && booking.canDownloadResults ? (
							<div className="flex items-center gap-2 text-green-700">
								<CheckCircle className="h-5 w-5" />
								<div>
									<p className="font-medium">All Verified</p>
									<p className="text-green-600 text-xs">
										Results available for download
									</p>
								</div>
							</div>
						) : booking.isPaid ? (
							<div className="flex items-center gap-2 text-amber-700">
								<Clock className="h-5 w-5" />
								<div>
									<p className="font-medium">Documents Being Verified</p>
									<p className="text-amber-600 text-xs">
										Results locked until verification complete
									</p>
								</div>
							</div>
						) : booking.hasUnverifiedPayments ? (
							<div className="flex items-center gap-2 text-yellow-700">
								<Clock className="h-5 w-5" />
								<div>
									<p className="font-medium">Payment Pending Verification</p>
									<p className="text-xs text-yellow-600">
										Admin will verify your payment soon
									</p>
								</div>
							</div>
						) : (
							<div className="flex items-center gap-2 text-slate-600">
								<Lock className="h-5 w-5" />
								<div>
									<p className="font-medium">Payment Required</p>
									<p className="text-slate-500 text-xs">
										Pay to unlock results download
									</p>
								</div>
							</div>
						)}
					</div>

					{!booking.isPaid && booking.serviceForms.length > 0 && (
						<Button className="w-full" disabled variant="outline">
							Upload Payment Receipt
						</Button>
					)}
				</CardContent>
			</Card>

			{/* Project Info */}
			{booking.projectDescription && (
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-base">Project Description</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-slate-700 text-sm">
							{booking.projectDescription}
						</p>
					</CardContent>
				</Card>
			)}

			{/* Samples Summary */}
			<Card>
				<CardHeader className="pb-2">
					<CardTitle className="text-base">Samples Summary</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-2 text-sm">
						<div className="flex items-center justify-between">
							<span className="text-slate-500">Total Samples</span>
							<span className="font-medium text-slate-900">
								{booking.totalSamples}
							</span>
						</div>
						<div className="flex items-center justify-between">
							<span className="text-slate-500">Completed</span>
							<span className="font-medium text-green-600">
								{booking.samplesCompleted}
							</span>
						</div>
						<div className="flex items-center justify-between">
							<span className="text-slate-500">In Progress</span>
							<span className="font-medium text-purple-600">
								{booking.totalSamples - booking.samplesCompleted}
							</span>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
