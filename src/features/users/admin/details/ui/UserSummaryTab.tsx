"use client";

import {
    Calendar,
    DollarSign,
    FileText,
    Loader2,
    TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useUserSummary } from "@/entities/user/api";
import { Badge } from "@/shared/ui/shadcn/badge";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/shared/ui/shadcn/card";
import { Separator } from "@/shared/ui/shadcn/separator";

interface UserSummaryTabProps {
    userId: string;
}

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("en-MY", {
        style: "currency",
        currency: "MYR",
    }).format(amount);
}

function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

export function UserSummaryTab({ userId }: UserSummaryTabProps) {
    const { data, isLoading, error } = useUserSummary(userId);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="mr-2 size-4 animate-spin" />
                <p className="text-muted-foreground">Loading summary...</p>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="flex items-center justify-center py-12">
                <p className="text-destructive">
                    {error instanceof Error
                        ? error.message
                        : "Failed to load summary data"}
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* 1. Booking Overview */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="size-5" />
                        Booking Overview
                    </CardTitle>
                    <CardDescription>Summary of user bookings</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
                        <div>
                            <p className="text-muted-foreground text-sm">Total</p>
                            <p className="font-bold text-2xl">{data.bookingOverview.total}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground text-sm">Upcoming</p>
                            <p className="font-bold text-2xl text-blue-600">
                                {data.bookingOverview.upcoming}
                            </p>
                        </div>
                        <div>
                            <p className="text-muted-foreground text-sm">Completed</p>
                            <p className="font-bold text-2xl text-green-600">
                                {data.bookingOverview.completed}
                            </p>
                        </div>
                        <div>
                            <p className="text-muted-foreground text-sm">Cancelled</p>
                            <p className="font-bold text-2xl text-gray-600">
                                {data.bookingOverview.cancelled}
                            </p>
                        </div>
                        <div>
                            <p className="text-muted-foreground text-sm">Rejected</p>
                            <p className="font-bold text-2xl text-red-600">
                                {data.bookingOverview.rejected}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* 2. Recent Bookings */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Bookings</CardTitle>
                    <CardDescription>Last 10 bookings</CardDescription>
                </CardHeader>
                <CardContent>
                    {data.recentBookings.length === 0 ? (
                        <p className="py-4 text-center text-muted-foreground">
                            No bookings yet
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {data.recentBookings.map((booking) => (
                                <div
                                    className="flex items-center justify-between rounded-lg border p-3"
                                    key={booking.id}
                                >
                                    <div className="flex-1">
                                        <Link
                                            className="font-medium hover:underline"
                                            href={`/admin/bookings/${booking.id}`}
                                        >
                                            {booking.referenceNumber}
                                        </Link>
                                        <p className="text-muted-foreground text-sm">
                                            {formatDate(booking.createdAt)} •{" "}
                                            {formatCurrency(booking.totalAmount)}
                                        </p>
                                    </div>
                                    <Badge
                                        className="ml-4"
                                        variant={
                                            booking.status === "approved" ||
                                                booking.status === "completed" ||
                                                booking.status === "in_progress"
                                                ? "default"
                                                : booking.status === "rejected" ||
                                                    booking.status === "cancelled"
                                                    ? "destructive"
                                                    : "secondary"
                                        }
                                    >
                                        {booking.status
                                            .split("_")
                                            .map(
                                                (word) => word.charAt(0).toUpperCase() + word.slice(1),
                                            )
                                            .join(" ")}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* 3. Financial Summary */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <DollarSign className="size-5" />
                        Financial Summary
                    </CardTitle>
                    <CardDescription>Payment and invoice information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div>
                            <p className="text-muted-foreground text-sm">Total Spent</p>
                            <p className="font-bold text-2xl text-green-600">
                                {formatCurrency(data.financialSummary.totalSpent)}
                            </p>
                        </div>
                        <div>
                            <p className="text-muted-foreground text-sm">Outstanding</p>
                            <p className="font-bold text-2xl text-red-600">
                                {formatCurrency(data.financialSummary.outstanding)}
                            </p>
                        </div>
                        <div>
                            <p className="text-muted-foreground text-sm">Pending</p>
                            <p className="font-bold text-2xl text-yellow-600">
                                {formatCurrency(data.financialSummary.pending)}
                            </p>
                        </div>
                    </div>
                    <Separator />
                    {data.financialSummary.lastPaymentDate ? (
                        <div>
                            <p className="text-muted-foreground text-sm">Last Payment</p>
                            <p className="font-medium">
                                {formatCurrency(data.financialSummary.lastPaymentAmount || 0)}{" "}
                                on {formatDate(data.financialSummary.lastPaymentDate)}
                            </p>
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-sm">No payments yet</p>
                    )}
                </CardContent>
            </Card>

            {/* 4. Usage Patterns */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="size-5" />
                        Usage Patterns
                    </CardTitle>
                    <CardDescription>Most used services and equipment</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <p className="mb-2 font-medium">Top Services</p>
                        {data.usagePatterns.topServices.length === 0 ? (
                            <p className="text-muted-foreground text-sm">
                                No services used yet
                            </p>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {data.usagePatterns.topServices.map((service) => (
                                    <Badge key={service.name} variant="secondary">
                                        {service.name} ({service.count})
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>
                    <Separator />
                    <div>
                        <p className="mb-2 font-medium">Top Equipment</p>
                        {data.usagePatterns.topEquipment.length === 0 ? (
                            <p className="text-muted-foreground text-sm">
                                No equipment used yet
                            </p>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {data.usagePatterns.topEquipment.map((equipment) => (
                                    <Badge key={equipment.name} variant="outline">
                                        {equipment.name} ({equipment.count})
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>
                    <Separator />
                    <div>
                        <p className="text-muted-foreground text-sm">
                            Average Booking Frequency
                        </p>
                        <p className="font-semibold text-xl">
                            {data.usagePatterns.averageBookingFrequency.toFixed(1)}{" "}
                            bookings/month
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* 5. Document & Verification Status */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="size-5" />
                        Document & Verification Status
                    </CardTitle>
                    <CardDescription>Document verification overview</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                        <div>
                            <p className="text-muted-foreground text-sm">Total Documents</p>
                            <p className="font-bold text-2xl">
                                {data.documentStatus.totalDocuments}
                            </p>
                        </div>
                        <div>
                            <p className="text-muted-foreground text-sm">Verified</p>
                            <p className="font-bold text-2xl text-green-600">
                                {data.documentStatus.verified}
                            </p>
                        </div>
                        <div>
                            <p className="text-muted-foreground text-sm">Pending</p>
                            <p className="font-bold text-2xl text-yellow-600">
                                {data.documentStatus.pending}
                            </p>
                        </div>
                        <div>
                            <p className="text-muted-foreground text-sm">Rejected</p>
                            <p className="font-bold text-2xl text-red-600">
                                {data.documentStatus.rejected}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
