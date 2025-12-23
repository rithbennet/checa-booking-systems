"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useCreateDepartment } from "@/entities/organization/api";
import {
	type CreateDepartmentInput,
	CreateDepartmentSchema,
} from "@/entities/organization/model/schema";
import { Button } from "@/shared/ui/shadcn/button";
import { Input } from "@/shared/ui/shadcn/input";
import { Label } from "@/shared/ui/shadcn/label";

interface CreateDepartmentFormProps {
	facultyId: string;
	onSuccess?: () => void;
}

export function CreateDepartmentForm({
	facultyId,
	onSuccess,
}: CreateDepartmentFormProps) {
	const { mutate: createDepartment, isPending } = useCreateDepartment();

	const {
		register,
		handleSubmit,
		formState: { errors },
		reset,
	} = useForm<CreateDepartmentInput>({
		resolver: zodResolver(CreateDepartmentSchema),
		defaultValues: {
			facultyId,
		},
	});

	const onSubmit = (data: CreateDepartmentInput) => {
		createDepartment(data, {
			onSuccess: () => {
				toast.success("Department created successfully");
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
			<input type="hidden" {...register("facultyId")} />

			<div className="space-y-2">
				<Label htmlFor="code">Department Code</Label>
				<Input id="code" {...register("code")} placeholder="e.g. ESE" />
				{errors.code && (
					<p className="text-red-500 text-sm">{errors.code.message}</p>
				)}
			</div>

			<div className="space-y-2">
				<Label htmlFor="name">Department Name</Label>
				<Input
					id="name"
					{...register("name")}
					placeholder="e.g. Electronic Systems Engineering"
				/>
				{errors.name && (
					<p className="text-red-500 text-sm">{errors.name.message}</p>
				)}
			</div>

			<Button disabled={isPending} type="submit">
				{isPending ? "Creating..." : "Create Department"}
			</Button>
		</form>
	);
}
