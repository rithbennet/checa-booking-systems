"use client";

import type { UseFormReturn } from "react-hook-form";
import type { CreateBookingInput } from "@/entities/booking/model/schemas";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/shared/ui/shadcn/card";
import type { BookingProfile } from "../../model/types";
import { PayerInfoForm } from "../Review/PayerInfoForm";

interface PayerInfoStepProps {
	form: UseFormReturn<CreateBookingInput>;
	profile: BookingProfile;
	userType: "mjiit_member" | "utm_member" | "external_member";
}

export function PayerInfoStep({ form, profile, userType }: PayerInfoStepProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-xl">Billing & Payer Information</CardTitle>
				<CardDescription>
					Specify who will be responsible for payment and billing details
				</CardDescription>
			</CardHeader>
			<CardContent>
				<PayerInfoForm form={form} profile={profile} userType={userType} />
			</CardContent>
		</Card>
	);
}
