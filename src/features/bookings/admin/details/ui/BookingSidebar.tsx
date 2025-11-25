/**
 * BookingSidebar Component
 *
 * Right sidebar for the booking command center containing:
 * - Timeline Widget (target completion, urgent flag)
 * - Document Vault (client uploads, admin docs)
 * - Financial Gate (payment status, verification)
 */

"use client";

import type { invoice_status_enum } from "generated/prisma";
import {
	CalendarClock,
	CheckCircle,
	ChevronDown,
	Download,
	FileCheck,
	FilePlus,
	FileText,
	Lock,
	Plus,
} from "lucide-react";
import { useState } from "react";
import type {
	BookingCommandCenterVM,
	InvoiceVM,
} from "@/entities/booking/model/command-center-types";
import { Badge } from "@/shared/ui/shadcn/badge";
import { Button } from "@/shared/ui/shadcn/button";
import { Checkbox } from "@/shared/ui/shadcn/checkbox";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/shared/ui/shadcn/collapsible";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/shared/ui/shadcn/tooltip";
import { formatCurrency, formatDate, getDaysRemaining } from "../lib/helpers";

interface BookingSidebarProps {
	booking: BookingCommandCenterVM;
}

// Timeline Widget Component
function TimelineWidget({ booking }: { booking: BookingCommandCenterVM }) {
	const [isUrgent, setIsUrgent] = useState(false);

	const targetDate = booking.preferredEndDate;
	const daysRemaining = getDaysRemaining(targetDate);

	return (
		<div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
			<div className="mb-4 flex items-center justify-between">
				<h3 className="flex items-center gap-2 font-bold text-slate-900">
					<CalendarClock className="h-4 w-4 text-slate-400" />
					Timeline
				</h3>
				<Tooltip>
					<TooltipTrigger asChild>
						<button
							className="cursor-not-allowed text-slate-400 text-xs"
							type="button"
						>
							Edit
						</button>
					</TooltipTrigger>
					<TooltipContent>
						<p>Timeline editing coming soon</p>
					</TooltipContent>
				</Tooltip>
			</div>

			<div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
				<p className="font-bold text-[10px] text-slate-400 uppercase tracking-wider">
					Target Completion
				</p>
				<p className="font-bold text-lg text-slate-900">
					{targetDate ? formatDate(targetDate) : "Not set"}
				</p>
				{daysRemaining !== null && (
					<p className="mt-0.5 text-[10px] text-slate-500">
						{daysRemaining > 0
							? `${daysRemaining} days remaining`
							: daysRemaining === 0
								? "Due today"
								: `${Math.abs(daysRemaining)} days overdue`}
					</p>
				)}
			</div>

			<div className="mt-3">
				<Tooltip>
					<TooltipTrigger asChild>
						<label
							className="flex cursor-not-allowed items-center gap-2 font-medium text-slate-400 text-xs"
							htmlFor="urgent-checkbox"
						>
							<Checkbox
								checked={isUrgent}
								className="rounded border-slate-300"
								disabled
								id="urgent-checkbox"
								onCheckedChange={(checked) => setIsUrgent(checked === true)}
							/>
							Flag as <span className="font-bold text-red-400">Urgent</span>
						</label>
					</TooltipTrigger>
					<TooltipContent>
						<p>Urgent flagging coming soon</p>
					</TooltipContent>
				</Tooltip>
			</div>
		</div>
	);
}

// Document Vault Component
function DocumentVault({ booking }: { booking: BookingCommandCenterVM }) {
	// Get all documents from service forms
	const serviceForms = booking.serviceForms;
	const invoices = serviceForms.flatMap((f) => f.invoices);

	return (
		<div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
			<div className="flex items-center justify-between border-slate-100 border-b bg-slate-50/50 p-4">
				<h3 className="font-bold text-slate-900 text-sm">Documents</h3>
				<Tooltip>
					<TooltipTrigger asChild>
						<button className="cursor-not-allowed text-slate-300" type="button">
							<Plus className="h-4 w-4" />
						</button>
					</TooltipTrigger>
					<TooltipContent>
						<p>Add documents coming soon</p>
					</TooltipContent>
				</Tooltip>
			</div>

			{/* Client Uploads Section */}
			<div className="space-y-2 p-4">
				<p className="mb-2 font-bold text-[10px] text-slate-400 uppercase tracking-wider">
					Client Uploads
				</p>

				{serviceForms
					.filter((f) => f.serviceFormSignedPdfPath)
					.map((form) => (
						<Tooltip key={form.id}>
							<TooltipTrigger asChild>
								<div className="group flex cursor-not-allowed items-center gap-3 rounded border border-transparent p-2">
									<FileCheck className="h-4 w-4 text-slate-400" />
									<div className="flex-1 overflow-hidden">
										<p className="truncate font-medium text-slate-900 text-xs">
											Signed_Service_Form.pdf
										</p>
										<p className="text-[10px] text-slate-400">
											{form.formNumber} • {formatDate(form.generatedAt)}
										</p>
									</div>
									<Download className="h-3 w-3 text-slate-300" />
								</div>
							</TooltipTrigger>
							<TooltipContent>
								<p>Document download coming soon</p>
							</TooltipContent>
						</Tooltip>
					))}

				{serviceForms.filter((f) => f.serviceFormSignedPdfPath).length ===
					0 && <p className="text-slate-400 text-xs italic">No uploads yet</p>}
			</div>

			{/* Admin / System Generated Documents */}
			<div className="border-slate-100 border-t bg-slate-50 p-4">
				<p className="mb-2 font-bold text-[10px] text-slate-400 uppercase tracking-wider">
					Admin / System
				</p>
				<div className="space-y-2">
					{/* Invoices */}
					{invoices.map((invoice) => (
						<InvoiceDocumentRow invoice={invoice} key={invoice.id} />
					))}

					{/* Generate Service Form Button */}
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								className="flex h-auto w-full cursor-not-allowed items-center justify-center gap-2 rounded border border-slate-300 bg-white py-2 font-medium text-slate-400 text-xs shadow-sm"
								disabled
								variant="outline"
							>
								<FilePlus className="h-3.5 w-3.5" />
								Generate Service Form
							</Button>
						</TooltipTrigger>
						<TooltipContent>
							<p>Service form generation coming soon</p>
						</TooltipContent>
					</Tooltip>
				</div>
			</div>
		</div>
	);
}

function InvoiceDocumentRow({ invoice }: { invoice: InvoiceVM }) {
	const statusConfig: Record<
		invoice_status_enum,
		{ label: string; className: string }
	> = {
		pending: {
			label: "Draft",
			className: "bg-yellow-50 text-yellow-700 border-yellow-100",
		},
		sent: {
			label: "Sent",
			className: "bg-blue-50 text-blue-700 border-blue-100",
		},
		paid: {
			label: "Paid",
			className: "bg-green-50 text-green-700 border-green-100",
		},
		overdue: {
			label: "Overdue",
			className: "bg-red-50 text-red-700 border-red-100",
		},
		cancelled: {
			label: "Cancelled",
			className: "bg-slate-50 text-slate-600 border-slate-100",
		},
	};

	const config = statusConfig[invoice.status];

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<div className="flex cursor-not-allowed items-center gap-3 rounded border border-slate-200 bg-white p-2">
					<FileText className="h-4 w-4 text-slate-400" />
					<div className="flex-1 overflow-hidden">
						<p className="truncate font-medium text-slate-900 text-xs">
							{invoice.invoiceNumber}.pdf
						</p>
						<Badge
							className={`${config.className} mt-1 text-[10px]`}
							variant="outline"
						>
							{config.label}
						</Badge>
					</div>
					{invoice.status === "pending" && (
						<Button
							className="h-auto cursor-not-allowed rounded bg-slate-400 px-2 py-1 text-white text-xs"
							disabled
							size="sm"
						>
							Send
						</Button>
					)}
				</div>
			</TooltipTrigger>
			<TooltipContent>
				<p>Invoice management coming soon</p>
			</TooltipContent>
		</Tooltip>
	);
}

// Financial Gate Component
function FinancialGate({ booking }: { booking: BookingCommandCenterVM }) {
	const [servicesOpen, setServicesOpen] = useState(false);

	const totalAmount = Number.parseFloat(booking.totalAmount);
	const isPaid = booking.isPaid;
	const firstInvoice = booking.serviceForms[0]?.invoices[0];

	// Count total items
	const serviceCount = booking.serviceItems.length;
	const workspaceCount = booking.workspaceBookings.length;
	const totalItems = serviceCount + workspaceCount;

	return (
		<div className="relative overflow-hidden rounded-xl border-2 border-orange-100 bg-white shadow-sm">
			{/* Header */}
			<div className="relative z-10 flex items-center justify-between border-slate-100 border-b p-5">
				<h3 className="font-bold text-slate-900">Financial Gate</h3>
				<div className="flex items-center gap-2">
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								className="h-auto cursor-not-allowed rounded border border-slate-200 bg-slate-100 px-2 py-1 font-medium text-[10px] text-slate-400"
								disabled
								size="sm"
								variant="outline"
							>
								+ Add Charge
							</Button>
						</TooltipTrigger>
						<TooltipContent>
							<p>Add charges coming soon</p>
						</TooltipContent>
					</Tooltip>
				</div>
			</div>

			{/* Services Accordion */}
			<Collapsible onOpenChange={setServicesOpen} open={servicesOpen}>
				<CollapsibleTrigger className="flex w-full items-center justify-between border-slate-100 border-b bg-slate-50/50 px-5 py-3 text-left hover:bg-slate-50">
					<div className="flex items-center gap-2">
						<span className="font-medium text-slate-700 text-xs">
							Services & Items
						</span>
						<Badge
							className="border-slate-200 bg-slate-100 text-[10px] text-slate-600"
							variant="outline"
						>
							{totalItems} {totalItems === 1 ? "item" : "items"}
						</Badge>
					</div>
					<ChevronDown
						className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${servicesOpen ? "rotate-180" : ""}`}
					/>
				</CollapsibleTrigger>
				<CollapsibleContent>
					<div className="divide-y divide-slate-100 bg-white">
						{booking.serviceItems.map((item) => (
							<div
								className="flex items-start justify-between px-5 py-3"
								key={item.id}
							>
								<div className="flex-1">
									<p className="font-medium text-slate-900 text-xs">
										{item.service.name}
									</p>
									<p className="text-[10px] text-slate-500">
										{item.quantity} {item.quantity === 1 ? "sample" : "samples"}
										{item.sampleName && ` • ${item.sampleName}`}
									</p>
								</div>
								<p className="font-bold text-slate-900 text-xs">
									{formatCurrency(item.totalPrice)}
								</p>
							</div>
						))}
						{booking.workspaceBookings.map((ws) => (
							<div
								className="flex items-start justify-between px-5 py-3"
								key={ws.id}
							>
								<div className="flex-1">
									<p className="font-medium text-slate-900 text-xs">
										Workspace Rental
									</p>
									<p className="text-[10px] text-slate-500">
										{formatDate(ws.startDate)} - {formatDate(ws.endDate)}
									</p>
								</div>
							</div>
						))}
						{totalItems === 0 && (
							<p className="px-5 py-3 text-center text-slate-400 text-xs italic">
								No services added
							</p>
						)}
					</div>
				</CollapsibleContent>
			</Collapsible>

			{/* Total and Payment Section */}
			<div className="relative z-10 p-5">
				<div className="mb-4 flex items-end justify-between">
					<div>
						<p className="font-bold text-[10px] text-slate-400 uppercase">
							Total Due
						</p>
						<p className="font-bold text-2xl text-slate-900">
							{formatCurrency(totalAmount)}
						</p>
						{firstInvoice && (
							<p className="mt-1 text-[10px] text-slate-400">
								Invoice #{firstInvoice.invoiceNumber} (
								{firstInvoice.status === "sent" ? "Sent" : firstInvoice.status})
							</p>
						)}
					</div>
					<Badge
						className={
							isPaid
								? "border-green-200 bg-green-100 text-green-700"
								: "border-orange-200 bg-orange-100 text-orange-700"
						}
						variant="outline"
					>
						{isPaid ? "Paid" : "Unpaid"}
					</Badge>
				</div>

				{/* Lock icon for unpaid bookings */}
				{!isPaid && (
					<div className="absolute top-0 right-0 opacity-5">
						<Lock className="h-20 w-20 text-slate-900" />
					</div>
				)}

				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							className="relative z-10 flex w-full cursor-not-allowed items-center justify-center gap-2 rounded bg-slate-400 py-2.5 font-bold text-white text-xs shadow-sm"
							disabled
						>
							<CheckCircle className="h-4 w-4" />
							{booking.hasUnverifiedPayments
								? "Verify Payment Proof"
								: isPaid
									? "Payment Verified"
									: "Record Payment"}
						</Button>
					</TooltipTrigger>
					<TooltipContent>
						<p>Payment recording coming soon</p>
					</TooltipContent>
				</Tooltip>
			</div>
		</div>
	);
}

// Main Sidebar Component
export function BookingSidebar({ booking }: BookingSidebarProps) {
	return (
		<div className="space-y-6">
			<TimelineWidget booking={booking} />
			<DocumentVault booking={booking} />
			<FinancialGate booking={booking} />
		</div>
	);
}
