"use client";

import { AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { CreateBookingInput } from "@/entities/booking/model/schemas";
import { buildInvoiceAddressDisplay, campusLabel } from "@/entities/invoice";
import { Alert, AlertDescription } from "@/shared/ui/shadcn/alert";
import { Input } from "@/shared/ui/shadcn/input";
import { Label } from "@/shared/ui/shadcn/label";
import { Textarea } from "@/shared/ui/shadcn/textarea";
import type { BookingProfile } from "../../model/types";

interface PayerInfoFormProps {
	form: UseFormReturn<CreateBookingInput>;
	profile: BookingProfile;
	userType: "mjiit_member" | "utm_member" | "external_member";
}

export function PayerInfoForm({ form, profile, userType }: PayerInfoFormProps) {
	const isExternal = userType === "external_member";
	const isInstitutional = !isExternal;
	const isStudent = profile.academicType === "student";

	const [payerChoice, setPayerChoice] = useState<
		"self" | "supervisor" | undefined
	>(undefined);

	// Ensure all hidden billing fields are registered with the form
	useEffect(() => {
		form.register("payerType");
		form.register("billingName");
		form.register("billingAddressDisplay");
		form.register("billingPhone");
		form.register("billingEmail");
		form.register("utmCampus");
	}, [form]);

	// Derive initial payerType from form or profile
	useEffect(() => {
		const currentPayerType = form.getValues("payerType");
		if (currentPayerType) {
			if (currentPayerType === "student-self") {
				setPayerChoice("self");
			} else if (currentPayerType === "student-supervisor") {
				setPayerChoice("supervisor");
			}
		}
	}, [form]);

	// Ensure institutional students default to self when no choice yet
	useEffect(() => {
		if (isInstitutional && isStudent && !payerChoice) {
			const currentPayerType = form.getValues("payerType");
			if (currentPayerType === "student-self") {
				setPayerChoice("self");
			} else if (currentPayerType === "student-supervisor") {
				setPayerChoice("supervisor");
			} else {
				setPayerChoice("self");
			}
		}
	}, [form, isInstitutional, isStudent, payerChoice]);

	// External member logic
	useEffect(() => {
		if (isExternal) {
			form.setValue("payerType", "external");
			form.setValue("billingName", profile.fullName);
			form.setValue(
				"billingAddressDisplay",
				buildInvoiceAddressDisplay({
					organizationAddress: profile.organizationAddress,
					isExternal: true,
				}),
			);
			form.setValue("billingPhone", profile.phone || undefined);
			form.setValue("billingEmail", profile.email || undefined);
			form.setValue("utmCampus", undefined);
		}
	}, [isExternal, profile, form]);

	// Staff member logic
	useEffect(() => {
		if (isInstitutional && profile.academicType === "staff") {
			form.setValue("payerType", "staff");
			form.setValue("billingName", profile.fullName);
			const address = buildInvoiceAddressDisplay({
				department: profile.department,
				faculty: profile.faculty,
				utmCampus: profile.utmCampus || undefined,
			});
			form.setValue("billingAddressDisplay", address);
			form.setValue("utmCampus", profile.utmCampus || undefined);
			form.setValue("billingPhone", profile.phone || undefined);
			form.setValue("billingEmail", profile.email || undefined);
		}
	}, [isInstitutional, profile, form]);

	// Student member logic
	useEffect(() => {
		if (isInstitutional && isStudent && payerChoice) {
			if (payerChoice === "self") {
				form.setValue("payerType", "student-self");
				form.setValue("billingName", profile.fullName);
				form.setValue("billingPhone", profile.phone || undefined);
				form.setValue("billingEmail", profile.email || undefined);
			} else if (payerChoice === "supervisor") {
				form.setValue("payerType", "student-supervisor");
				form.setValue("billingName", profile.supervisorName || "");
				form.setValue("billingPhone", profile.phone || undefined);
				form.setValue("billingEmail", profile.email || undefined);
			}
			const address = buildInvoiceAddressDisplay({
				department: profile.department,
				faculty: profile.faculty,
				utmCampus: profile.utmCampus || undefined,
			});
			form.setValue("billingAddressDisplay", address);
			form.setValue("utmCampus", profile.utmCampus || undefined);
		}
	}, [isInstitutional, isStudent, payerChoice, profile, form]);

	// External member
	if (isExternal) {
		const hasAddress = !!profile.organizationAddress?.trim();
		return (
			<div className="space-y-4">
				{!hasAddress && (
					<Alert variant="destructive">
						<AlertCircle className="h-4 w-4" />
						<AlertDescription>
							Please complete your organization address in your profile before
							proceeding with the booking.
						</AlertDescription>
					</Alert>
				)}
				<div className="space-y-2">
					<Label className="font-medium text-gray-700">Billing Name</Label>
					<Input disabled readOnly value={profile.fullName} />
				</div>
				<div className="space-y-2">
					<Label className="font-medium text-gray-700">
						Billing Address <span className="text-red-500">*</span>
					</Label>
					<Textarea
						disabled
						readOnly
						rows={3}
						value={profile.organizationAddress || "Not provided"}
					/>
					{!hasAddress && (
						<p className="text-red-500 text-sm">
							Organization address is required for external members.
						</p>
					)}
				</div>
			</div>
		);
	}

	// Staff member
	if (isInstitutional && profile.academicType === "staff") {
		const address = buildInvoiceAddressDisplay({
			department: profile.department,
			faculty: profile.faculty,
			utmCampus: profile.utmCampus || undefined,
		});
		return (
			<div className="space-y-4">
				<div className="space-y-2">
					<Label className="font-medium text-gray-700">Payer Type</Label>
					<Input disabled readOnly value="Staff" />
				</div>
				<div className="space-y-2">
					<Label className="font-medium text-gray-700">Billing Name</Label>
					<Input disabled readOnly value={profile.fullName} />
				</div>
				<div className="space-y-2">
					<Label className="font-medium text-gray-700">Billing Address</Label>
					<Textarea disabled readOnly rows={2} value={address} />
					<p className="text-gray-500 text-xs">
						{profile.department && `${profile.department}, `}
						{profile.faculty && `${profile.faculty}, `}
						{campusLabel(profile.utmCampus || undefined)}
					</p>
				</div>
			</div>
		);
	}

	// Student member
	if (isInstitutional && isStudent) {
		const hasSupervisor = !!profile.supervisorName?.trim();
		const address = buildInvoiceAddressDisplay({
			department: profile.department,
			faculty: profile.faculty,
			utmCampus: profile.utmCampus || undefined,
		});

		return (
			<div className="space-y-4">
				<div className="space-y-3">
					<Label className="font-medium text-gray-700">
						Who will pay for this booking?{" "}
						<span className="text-red-500">*</span>
					</Label>
					<div className="space-y-2">
						<label className="flex items-center space-x-2">
							<input
								checked={payerChoice === "self"}
								className="h-4 w-4"
								onChange={() => setPayerChoice("self")}
								type="radio"
								value="self"
							/>
							<span className="text-sm">Myself (Student pays)</span>
						</label>
						<label className="flex items-center space-x-2">
							<input
								checked={payerChoice === "supervisor"}
								className="h-4 w-4"
								disabled={!hasSupervisor}
								onChange={() => setPayerChoice("supervisor")}
								type="radio"
								value="supervisor"
							/>
							<span className="text-sm">
								My Supervisor
								{!hasSupervisor && (
									<span className="text-red-500 text-sm"> (Not provided)</span>
								)}
							</span>
						</label>
					</div>
					{!hasSupervisor && (
						<p className="text-amber-600 text-sm">
							Please add your supervisor's name in your profile to enable this
							option.
						</p>
					)}
				</div>

				{payerChoice && (
					<>
						<div className="space-y-2">
							<Label className="font-medium text-gray-700">Billing Name</Label>
							<Input
								disabled
								readOnly
								value={
									payerChoice === "self"
										? profile.fullName
										: profile.supervisorName || ""
								}
							/>
						</div>
						<div className="space-y-2">
							<Label className="font-medium text-gray-700">
								Billing Address
							</Label>
							<Textarea disabled readOnly rows={2} value={address} />
							<p className="text-gray-500 text-xs">
								{profile.department && `${profile.department}, `}
								{profile.faculty && `${profile.faculty}, `}
								{campusLabel(profile.utmCampus || undefined)}
							</p>
						</div>
					</>
				)}
			</div>
		);
	}

	// Fallback
	return (
		<Alert variant="destructive">
			<AlertCircle className="h-4 w-4" />
			<AlertDescription>
				Unable to determine payer information. Please complete your profile.
			</AlertDescription>
		</Alert>
	);
}
