"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useUpdateBranch } from "@/entities/organization/api";
import {
	type UpdateBranchInput,
	UpdateBranchSchema,
} from "@/entities/organization/model/schema";
import { Button } from "@/shared/ui/shadcn/button";
import { Input } from "@/shared/ui/shadcn/input";
import { Label } from "@/shared/ui/shadcn/label";

interface EditBranchFormProps {
	branch: {
		id: string;
		name: string;
		address: string | null;
		city: string | null;
		state: string | null;
		postcode: string | null;
		country: string | null;
		phone: string | null;
	};
	onSuccess?: () => void;
}

export function EditBranchForm({ branch, onSuccess }: EditBranchFormProps) {
	const { mutate: updateBranch, isPending } = useUpdateBranch();

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<UpdateBranchInput>({
		resolver: zodResolver(UpdateBranchSchema),
		defaultValues: {
			id: branch.id,
			name: branch.name,
			address: branch.address ?? undefined,
			city: branch.city ?? undefined,
			state: branch.state ?? undefined,
			postcode: branch.postcode ?? undefined,
			country: branch.country ?? undefined,
			phone: branch.phone ?? undefined,
		},
	});

	const onSubmit = (data: UpdateBranchInput) => {
		updateBranch(data, {
			onSuccess: () => {
				toast.success("Branch updated successfully");
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
				<Label htmlFor="name">Branch Name</Label>
				<Input id="name" {...register("name")} />
				{errors.name && (
					<p className="text-red-500 text-sm">{errors.name.message}</p>
				)}
			</div>

			<div className="space-y-2">
				<Label htmlFor="address">Address (Optional)</Label>
				<Input id="address" {...register("address")} />
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

			<div className="grid grid-cols-2 gap-4">
				<div className="space-y-2">
					<Label htmlFor="postcode">Postcode (Optional)</Label>
					<Input id="postcode" {...register("postcode")} />
					{errors.postcode && (
						<p className="text-red-500 text-sm">{errors.postcode.message}</p>
					)}
				</div>
				<div className="space-y-2">
					<Label htmlFor="country">Country (Optional)</Label>
					<Input id="country" {...register("country")} />
					{errors.country && (
						<p className="text-red-500 text-sm">{errors.country.message}</p>
					)}
				</div>
			</div>

			<div className="space-y-2">
				<Label htmlFor="phone">Phone (Optional)</Label>
				<Input id="phone" {...register("phone")} />
				{errors.phone && (
					<p className="text-red-500 text-sm">{errors.phone.message}</p>
				)}
			</div>

			<Button disabled={isPending} type="submit">
				{isPending ? "Saving..." : "Save Changes"}
			</Button>
		</form>
	);
}
