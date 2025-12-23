"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useCreateFaculty } from "@/entities/organization/api";
import {
	type CreateFacultyInput,
	CreateFacultySchema,
} from "@/entities/organization/model/schema";
import { Button } from "@/shared/ui/shadcn/button";
import { Input } from "@/shared/ui/shadcn/input";
import { Label } from "@/shared/ui/shadcn/label";

interface CreateFacultyFormProps {
	onSuccess?: () => void;
}

export function CreateFacultyForm({ onSuccess }: CreateFacultyFormProps) {
	const { mutate: createFaculty, isPending } = useCreateFaculty();

	const {
		register,
		handleSubmit,
		formState: { errors },
		reset,
	} = useForm<CreateFacultyInput>({
		resolver: zodResolver(CreateFacultySchema),
	});

	const onSubmit = (data: CreateFacultyInput) => {
		createFaculty(data, {
			onSuccess: () => {
				toast.success("Faculty created successfully");
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
				<Label htmlFor="code">Faculty Code</Label>
				<Input id="code" {...register("code")} placeholder="e.g. MJIIT" />
				{errors.code && (
					<p className="text-red-500 text-sm">{errors.code.message}</p>
				)}
			</div>

			<div className="space-y-2">
				<Label htmlFor="name">Faculty Name</Label>
				<Input
					id="name"
					{...register("name")}
					placeholder="e.g. Malaysia-Japan International Institute of Technology"
				/>
				{errors.name && (
					<p className="text-red-500 text-sm">{errors.name.message}</p>
				)}
			</div>

			<Button disabled={isPending} type="submit">
				{isPending ? "Creating..." : "Create Faculty"}
			</Button>
		</form>
	);
}
