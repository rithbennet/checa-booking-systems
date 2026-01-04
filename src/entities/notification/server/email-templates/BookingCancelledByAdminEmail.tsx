/**
 * Booking Cancelled by Admin Email Template
 * Sent to the user when an admin cancels their booking
 */

import { Button, Heading, Text } from "@react-email/components";
import { BaseLayout } from "./BaseLayout";
import {
	button,
	heading,
	labelText,
	paragraph,
	reasonText,
} from "./styles/cancellation-email-styles";

interface BookingCancelledByAdminEmailProps {
	userName: string;
	referenceNumber: string;
	reason?: string;
	dashboardUrl: string;
}

export function BookingCancelledByAdminEmail({
	userName,
	referenceNumber,
	reason,
	dashboardUrl,
}: BookingCancelledByAdminEmailProps) {
	return (
		<BaseLayout preview={`Booking ${referenceNumber} has been cancelled`}>
			<Heading style={heading}>Booking Cancelled</Heading>
			<Text style={paragraph}>Dear {userName},</Text>
			<Text style={paragraph}>
				We regret to inform you that your booking request{" "}
				<strong>{referenceNumber}</strong> has been cancelled by our laboratory
				administrators.
			</Text>
			{reason && (
				<>
					<Text style={labelText}>Cancellation Reason:</Text>
					<Text style={reasonText}>{reason}</Text>
				</>
			)}
			<Text style={paragraph}>
				If you have any questions or concerns about this cancellation, please
				don't hesitate to contact us. We're here to help and may be able to
				provide alternative solutions.
			</Text>
			<Button href={dashboardUrl} style={button}>
				View Dashboard
			</Button>
			<Text style={paragraph}>
				We apologize for any inconvenience this may cause. Thank you for your
				understanding.
			</Text>
		</BaseLayout>
	);
}

export default BookingCancelledByAdminEmail;
