"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useUpdateCompany } from "@/entities/organization/api";
import {
	type UpdateCompanyInput,
	UpdateCompanySchema,
} from "@/entities/organization/model/schema";
import { Button } from "@/shared/ui/shadcn/button";
import { Input } from "@/shared/ui/shadcn/input";
import { Label } from "@/shared/ui/shadcn/label";

interface EditCompanyFormProps {
	company: {
		id: string;
		name: string;
		legalName: string | null;
		regNo: string | null;
	};
	onSuccess?: () => void;
}

export function EditCompanyForm({ company, onSuccess }: EditCompanyFormProps) {
	const { mutate: updateCompany, isPending } = useUpdateCompany();

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<UpdateCompanyInput>({
		resolver: zodResolver(UpdateCompanySchema),
		defaultValues: {
			id: company.id,
			name: company.name,
			legalName: company.legalName ?? undefined,
			regNo: company.regNo ?? undefined,
		},
	});

	const onSubmit = (data: UpdateCompanyInput) => {
		updateCompany(data, {
			onSuccess: () => {
				toast.success("Company updated successfully");
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
			<input type="hidden" {...register("id")} />

			<div className="space-y-2">
				<Label htmlFor="name">Company Name</Label>
				<Input id="name" {...register("name")} />
				{errors.name && (
					<p className="text-red-500 text-sm">{errors.name.message}</p>
				)}
			</div>

			<div className="space-y-2">
				<Label htmlFor="legalName">Legal Name (Optional)</Label>
				<Input id="legalName" {...register("legalName")} />
				{errors.legalName && (
					<p className="text-red-500 text-sm">{errors.legalName.message}</p>
				)}
			</div>

			<div className="space-y-2">
				<Label htmlFor="regNo">Registration No. (Optional)</Label>
				<Input id="regNo" {...register("regNo")} />
				{errors.regNo && (
					<p className="text-red-500 text-sm">{errors.regNo.message}</p>
				)}
			</div>

			<Button disabled={isPending} type="submit">
				{isPending ? "Saving..." : "Save Changes"}
			</Button>
		</form>
	);
}
