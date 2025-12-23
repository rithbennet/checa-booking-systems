"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useUpdateDepartment } from "@/entities/organization/api";
import {
	type UpdateDepartmentInput,
	UpdateDepartmentSchema,
} from "@/entities/organization/model/schema";
import { Button } from "@/shared/ui/shadcn/button";
import { Input } from "@/shared/ui/shadcn/input";
import { Label } from "@/shared/ui/shadcn/label";

interface EditDepartmentFormProps {
	department: { id: string; code: string; name: string };
	onSuccess?: () => void;
}

export function EditDepartmentForm({
	department,
	onSuccess,
}: EditDepartmentFormProps) {
	const { mutate: updateDepartment, isPending } = useUpdateDepartment();

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<UpdateDepartmentInput>({
		resolver: zodResolver(UpdateDepartmentSchema),
		defaultValues: {
			id: department.id,
			code: department.code,
			name: department.name,
		},
	});

	const onSubmit = (data: UpdateDepartmentInput) => {
		updateDepartment(data, {
			onSuccess: () => {
				toast.success("Department updated successfully");
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
				<Label htmlFor="code">Department Code</Label>
				<Input id="code" {...register("code")} />
				{errors.code && (
					<p className="text-red-500 text-sm">{errors.code.message}</p>
				)}
			</div>

			<div className="space-y-2">
				<Label htmlFor="name">Department Name</Label>
				<Input id="name" {...register("name")} />
				{errors.name && (
					<p className="text-red-500 text-sm">{errors.name.message}</p>
				)}
			</div>

			<Button disabled={isPending} type="submit">
				{isPending ? "Saving..." : "Save Changes"}
			</Button>
		</form>
	);
}
