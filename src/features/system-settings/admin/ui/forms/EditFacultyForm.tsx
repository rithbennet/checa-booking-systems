"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useUpdateFaculty } from "@/entities/organization/api";
import {
	type UpdateFacultyInput,
	UpdateFacultySchema,
} from "@/entities/organization/model/schema";
import { Button } from "@/shared/ui/shadcn/button";
import { Input } from "@/shared/ui/shadcn/input";
import { Label } from "@/shared/ui/shadcn/label";

interface EditFacultyFormProps {
	faculty: { id: string; code: string; name: string };
	onSuccess?: () => void;
}

export function EditFacultyForm({ faculty, onSuccess }: EditFacultyFormProps) {
	const { mutate: updateFaculty, isPending } = useUpdateFaculty();

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<UpdateFacultyInput>({
		resolver: zodResolver(UpdateFacultySchema),
		defaultValues: {
			id: faculty.id,
			code: faculty.code,
			name: faculty.name,
		},
	});

	const onSubmit = (data: UpdateFacultyInput) => {
		updateFaculty(data, {
			onSuccess: () => {
				toast.success("Faculty updated successfully");
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
				<Label htmlFor="code">Faculty Code</Label>
				<Input id="code" {...register("code")} />
				{errors.code && (
					<p className="text-red-500 text-sm">{errors.code.message}</p>
				)}
			</div>

			<div className="space-y-2">
				<Label htmlFor="name">Faculty Name</Label>
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
