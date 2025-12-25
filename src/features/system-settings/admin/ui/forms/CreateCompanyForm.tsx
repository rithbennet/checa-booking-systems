"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useCreateCompany } from "@/entities/organization/api";
import {
	type CreateCompanyInput,
	CreateCompanySchema,
} from "@/entities/organization/model/schema";
import { Button } from "@/shared/ui/shadcn/button";
import { Input } from "@/shared/ui/shadcn/input";
import { Label } from "@/shared/ui/shadcn/label";

interface CreateCompanyFormProps {
	onSuccess?: () => void;
}

export function CreateCompanyForm({ onSuccess }: CreateCompanyFormProps) {
	const { mutate: createCompany, isPending } = useCreateCompany();

	const {
		register,
		handleSubmit,
		formState: { errors },
		reset,
	} = useForm<CreateCompanyInput>({
		resolver: zodResolver(CreateCompanySchema),
	});

	const onSubmit = (data: CreateCompanyInput) => {
		createCompany(data, {
			onSuccess: () => {
				toast.success("Company created successfully");
				reset();
				onSuccess?.();
			},
			onError: (error) => {
				toast.error(
					error instanceof Error ? error.message : "An error occurred",
				);
			},
		});
	};

	return (
		<form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
			<div className="space-y-2">
				<Label htmlFor="name">Company Name</Label>
				<Input id="name" {...register("name")} placeholder="e.g. Acme Corp" />
				{errors.name && (
					<p className="text-red-500 text-sm">{errors.name.message}</p>
				)}
			</div>

			<div className="space-y-2">
				<Label htmlFor="legalName">Legal Name (Optional)</Label>
				<Input
					id="legalName"
					{...register("legalName")}
					placeholder="e.g. Acme Corporation Sdn Bhd"
				/>
				{errors.legalName && (
					<p className="text-red-500 text-sm">{errors.legalName.message}</p>
				)}
			</div>

			<div className="space-y-2">
				<Label htmlFor="regNo">Registration No. (Optional)</Label>
				<Input id="regNo" {...register("regNo")} placeholder="e.g. 123456-A" />
				{errors.regNo && (
					<p className="text-red-500 text-sm">{errors.regNo.message}</p>
				)}
			</div>

			<Button disabled={isPending} type="submit">
				{isPending ? "Creating..." : "Create Company"}
			</Button>
		</form>
	);
}
