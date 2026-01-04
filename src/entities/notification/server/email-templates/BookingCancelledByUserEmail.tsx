/**
 * Booking Cancelled by User Email Template
 * Sent to the user confirming their cancellation
 */

import { Button, Heading, Text } from "@react-email/components";
import type { BookingCancellationEmailProps } from "@/entities/notification/model/types";
import { BaseLayout } from "./BaseLayout";
import {
	button,
	heading,
	labelText,
	paragraph,
	reasonText,
} from "./styles/cancellation-email-styles";

export function BookingCancelledByUserEmail({
	userName,
	referenceNumber,
	reason,
	dashboardUrl,
}: BookingCancellationEmailProps) {
	return (
		<BaseLayout preview={`Booking ${referenceNumber} has been cancelled`}>
			<Heading style={heading}>Booking Cancelled</Heading>
			<Text style={paragraph}>Dear {userName},</Text>
			<Text style={paragraph}>
				Your booking request <strong>{referenceNumber}</strong> has been
				successfully cancelled as per your request.
			</Text>
			{reason && (
				<>
					<Text style={labelText}>Cancellation Reason:</Text>
					<Text style={reasonText}>{reason}</Text>
				</>
			)}
			<Text style={paragraph}>
				If you cancelled this booking by mistake or have any questions, please
				contact our laboratory administrators immediately.
			</Text>
			<Button href={dashboardUrl} style={button}>
				View Dashboard
			</Button>
			<Text style={paragraph}>
				Thank you for informing us. We hope to serve you again in the future.
			</Text>
		</BaseLayout>
	);
}

export default BookingCancelledByUserEmail;
