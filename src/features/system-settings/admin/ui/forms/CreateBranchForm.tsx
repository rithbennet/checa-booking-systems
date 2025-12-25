"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useCreateBranch } from "@/entities/organization/api";
import {
	type CreateBranchInput,
	CreateBranchSchema,
} from "@/entities/organization/model/schema";
import { Button } from "@/shared/ui/shadcn/button";
import { Input } from "@/shared/ui/shadcn/input";
import { Label } from "@/shared/ui/shadcn/label";

interface CreateBranchFormProps {
	companyId: string;
	onSuccess?: () => void;
}

export function CreateBranchForm({
	companyId,
	onSuccess,
}: CreateBranchFormProps) {
	const { mutate: createBranch, isPending } = useCreateBranch();

	const {
		register,
		handleSubmit,
		formState: { errors },
		reset,
	} = useForm<CreateBranchInput>({
		resolver: zodResolver(CreateBranchSchema),
		defaultValues: {
			companyId,
		},
	});

	const onSubmit = (data: CreateBranchInput) => {
		createBranch(data, {
			onSuccess: () => {
				toast.success("Branch created successfully");
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
			<input type="hidden" {...register("companyId")} />

			<div className="space-y-2">
				<Label htmlFor="name">Branch Name</Label>
				<Input
					id="name"
					{...register("name")}
					placeholder="e.g. HQ or Penang Branch"
				/>
				{errors.name && (
					<p className="text-red-500 text-sm">{errors.name.message}</p>
				)}
			</div>

			<div className="space-y-2">
				<Label htmlFor="address">Address (Optional)</Label>
				<Input
					id="address"
					{...register("address")}
					placeholder="Street address"
				/>
				{errors.address && (
					<p className="text-red-500 text-sm">{errors.address.message}</p>
				)}
			</div>

			<div className="grid grid-cols-2 gap-4">
				<div className="space-y-2">
					<Label htmlFor="city">City (Optional)</Label>
					<Input id="city" {...register("city")} />
				</div>
				<div className="space-y-2">
					<Label htmlFor="state">State (Optional)</Label>
					<Input id="state" {...register("state")} />
				</div>
			</div>

			<Button disabled={isPending} type="submit">
				{isPending ? "Creating..." : "Create Branch"}
			</Button>
		</form>
	);
}
