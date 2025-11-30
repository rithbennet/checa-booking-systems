/**
 * Admin Notification Email Template
 * For notifying admins of new bookings, pending verifications, etc.
 */

import { Button, Heading, Text } from "@react-email/components";
import { BaseLayout } from "./BaseLayout";

type AdminNotificationType =
    | "new_booking"
    | "new_user_pending"
    | "payment_pending"
    | "user_verified"
    | "signed_forms_uploaded";

interface AdminNotificationEmailProps {
    adminName: string;
    notificationType: AdminNotificationType;
    referenceNumber?: string;
    customerName?: string;
    customerEmail?: string;
    bookingCount?: number;
    adminDashboardUrl: string;
}

const notificationConfig: Record<
    AdminNotificationType,
    {
        title: string;
        getDescription: (props: AdminNotificationEmailProps) => string;
        color: string;
    }
> = {
    new_booking: {
        title: "New Booking Submitted",
        getDescription: (props) =>
            `A new booking (${props.referenceNumber}) has been submitted by ${props.customerName} (${props.customerEmail}) and requires your review.`,
        color: "#2563eb",
    },
    new_user_pending: {
        title: "New User Pending Verification",
        getDescription: (props) =>
            `A new user (${props.customerName} - ${props.customerEmail}) has registered and is pending account verification.`,
        color: "#d97706",
    },
    payment_pending: {
        title: "Payment Proof Uploaded",
        getDescription: (props) =>
            `A payment proof has been uploaded for booking ${props.referenceNumber} by ${props.customerName}. Please verify the payment.`,
        color: "#7c3aed",
    },
    user_verified: {
        title: "User Verified - Bookings Ready",
        getDescription: (props) =>
            `User ${props.customerEmail} has been verified. ${props.bookingCount || 0} booking(s) have been moved to pending approval.`,
        color: "#16a34a",
    },
    signed_forms_uploaded: {
        title: "Signed Forms Uploaded",
        getDescription: (props) =>
            `Signed service forms have been uploaded for booking ${props.referenceNumber} by ${props.customerName}. Please review and proceed with invoicing.`,
        color: "#0891b2",
    },
};

export function AdminNotificationEmail(props: AdminNotificationEmailProps) {
    const {
        adminName,
        notificationType,
        referenceNumber,
        customerName,
        customerEmail,
        adminDashboardUrl,
    } = props;
    const config = notificationConfig[notificationType];
    const description = config.getDescription(props);

    return (
        <BaseLayout preview={config.title}>
            <Heading style={{ ...heading, color: config.color }}>
                {config.title}
            </Heading>
            <Text style={paragraph}>Hi {adminName},</Text>
            <Text style={paragraph}>{description}</Text>

            {referenceNumber && (
                <Text style={detailsBox}>
                    <strong>Reference:</strong> {referenceNumber}
                    {customerName && (
                        <>
                            <br />
                            <strong>Customer:</strong> {customerName}
                        </>
                    )}
                    {customerEmail && (
                        <>
                            <br />
                            <strong>Email:</strong> {customerEmail}
                        </>
                    )}
                </Text>
            )}

            <Button
                href={adminDashboardUrl}
                style={{ ...button, backgroundColor: config.color }}
            >
                Go to Admin Dashboard
            </Button>

            <Text style={paragraph}>
                Please take action at your earliest convenience.
            </Text>
        </BaseLayout>
    );
}

// Styles
const heading = {
    fontSize: "24px",
    fontWeight: "bold" as const,
    marginBottom: "24px",
};

const paragraph = {
    fontSize: "14px",
    lineHeight: "24px",
    color: "#475569",
    margin: "16px 0",
};

const detailsBox = {
    fontSize: "14px",
    lineHeight: "28px",
    color: "#1e293b",
    backgroundColor: "#f8fafc",
    padding: "16px",
    borderRadius: "8px",
    margin: "16px 0",
};

const button = {
    borderRadius: "8px",
    color: "#fff",
    fontSize: "14px",
    fontWeight: "600" as const,
    textDecoration: "none",
    textAlign: "center" as const,
    display: "block",
    padding: "12px 24px",
    margin: "24px 0",
};

export default AdminNotificationEmail;
