"use client";

import {
    AlertTriangle,
    ArrowRight,
    Calendar,
    CheckCircle2,
    CreditCard,
    FileText,
    FlaskConical,
} from "lucide-react";
import type { UserBookingDetailVM } from "@/entities/booking/model/user-detail-types";
import { useDocumentVerificationState } from "@/entities/booking-document";
import { Button } from "@/shared/ui/shadcn/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/shared/ui/shadcn/card";
import { formatDate, getDaysRemaining } from "../lib/helpers";
import { UserBookingTimeline } from "./UserBookingTimeline";

interface UserBookingOverviewProps {
    booking: UserBookingDetailVM;
    onTabChange: (tab: string) => void;
}

export function UserBookingOverview({
    booking,
    onTabChange,
}: UserBookingOverviewProps) {
    const daysRemaining = getDaysRemaining(booking.preferredEndDate);
    const isFullyPaid = booking.isPaid;
    const { data: verificationState } = useDocumentVerificationState(booking.id);

    // Check if all documents are verified
    const allDocumentsVerified =
        verificationState &&
        verificationState.serviceFormSigned === "verified" &&
        (verificationState.workspaceFormSigned === "verified" ||
            verificationState.workspaceFormSigned === "not_required") &&
        verificationState.paymentReceipt === "verified";

    // Determine primary action/status message
    const getStatusContent = () => {
        if (booking.status === "revision_requested") {
            return {
                title: "Action Required: Revision Requested",
                description:
                    "The administrator has requested changes to your booking. Please review the notes and update your booking.",
                icon: AlertTriangle,
                color: "text-amber-600",
                bgColor: "bg-amber-50",
                borderColor: "border-amber-200",
                action: (
                    <Button
                        asChild
                        className="mt-2 border-amber-200 text-amber-700 hover:bg-amber-100"
                        variant="outline"
                    >
                        <a href={`/bookings/${booking.id}/edit`}>Edit Booking</a>
                    </Button>
                ),
            };
        }

        if (booking.status === "approved" && !isFullyPaid) {
            return {
                title: "Booking Approved - Payment Required",
                description:
                    "Your booking has been approved. Please proceed to the Documents tab to download your invoice and upload payment proof.",
                icon: CreditCard,
                color: "text-blue-600",
                bgColor: "bg-blue-50",
                borderColor: "border-blue-200",
                action: (
                    <Button
                        className="mt-2"
                        onClick={() => onTabChange("documents")}
                        variant="default"
                    >
                        Go to Payments <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                ),
            };
        }

        if (
            booking.status === "approved" &&
            isFullyPaid &&
            !allDocumentsVerified
        ) {
            return {
                title: "Payment Received - Signatures Needed",
                description:
                    "We have received your payment. Please sign and upload the required service forms to proceed.",
                icon: FileText,
                color: "text-purple-600",
                bgColor: "bg-purple-50",
                borderColor: "border-purple-200",
                action: (
                    <Button
                        className="mt-2"
                        onClick={() => onTabChange("documents")}
                        variant="default"
                    >
                        View Documents <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                ),
            };
        }

        if (booking.status === "in_progress") {
            return {
                title: "Lab Work in Progress",
                description:
                    "Your samples are currently being processed. You will be notified when results are available.",
                icon: FlaskConical,
                color: "text-indigo-600",
                bgColor: "bg-indigo-50",
                borderColor: "border-indigo-200",
                action: (
                    <Button
                        className="mt-2"
                        onClick={() => onTabChange("services")}
                        variant="outline"
                    >
                        Track Samples <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                ),
            };
        }

        if (booking.status === "completed") {
            return {
                title: "Booking Completed",
                description:
                    "All work has been completed. You can download your results from the Documents tab.",
                icon: CheckCircle2,
                color: "text-green-600",
                bgColor: "bg-green-50",
                borderColor: "border-green-200",
                action: (
                    <Button
                        className="mt-2"
                        onClick={() => onTabChange("documents")}
                        variant="outline"
                    >
                        View Results <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                ),
            };
        }

        return null;
    };

    const statusContent = getStatusContent();

    return (
        <div className="space-y-6">
            {/* Action Banner */}
            {statusContent && (
                <div
                    className={`flex flex-col gap-4 rounded-xl border p-6 ${statusContent.bgColor} ${statusContent.borderColor}`}
                >
                    <div className="flex items-start gap-4">
                        <div
                            className={`rounded-full bg-white p-2 shadow-sm ${statusContent.color}`}
                        >
                            <statusContent.icon className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                            <h3 className={`font-semibold text-lg ${statusContent.color}`}>
                                {statusContent.title}
                            </h3>
                            <p className="mt-1 text-slate-600">{statusContent.description}</p>
                            {statusContent.action}
                        </div>
                    </div>
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="font-medium text-slate-500 text-sm">
                            Time Remaining
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-slate-400" />
                            <span className="font-bold text-2xl text-slate-900">
                                {daysRemaining !== null
                                    ? daysRemaining > 0
                                        ? `${daysRemaining} Days`
                                        : "Due"
                                    : "N/A"}
                            </span>
                        </div>
                        <p className="mt-1 text-slate-500 text-xs">
                            Target:{" "}
                            {booking.preferredEndDate
                                ? formatDate(booking.preferredEndDate)
                                : "Not set"}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="font-medium text-slate-500 text-sm">
                            Samples Progress
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <FlaskConical className="h-4 w-4 text-slate-400" />
                            <span className="font-bold text-2xl text-slate-900">
                                {booking.samplesCompleted} / {booking.totalSamples}
                            </span>
                        </div>
                        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                            <div
                                className="h-full bg-blue-500 transition-all duration-500"
                                style={{
                                    width: `${booking.totalSamples > 0 ? (booking.samplesCompleted / booking.totalSamples) * 100 : 0}%`,
                                }}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="font-medium text-slate-500 text-sm">
                            Services
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-slate-400" />
                            <span className="font-bold text-2xl text-slate-900">
                                {booking.serviceItems.length}
                            </span>
                        </div>
                        <p className="mt-1 text-slate-500 text-xs">
                            {booking.workspaceBookings.length > 0
                                ? `+ ${booking.workspaceBookings.length} Workspace Bookings`
                                : "No workspace bookings"}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Timeline */}
            <UserBookingTimeline booking={booking} />

            {/* Project Description (if present) */}
            {booking.projectDescription && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Project Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-slate-600 leading-relaxed">
                            {booking.projectDescription}
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
