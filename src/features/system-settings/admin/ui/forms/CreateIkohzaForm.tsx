"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useCreateIkohza } from "@/entities/organization/api";
import {
	type CreateIkohzaInput,
	CreateIkohzaSchema,
} from "@/entities/organization/model/schema";
import { Button } from "@/shared/ui/shadcn/button";
import { Input } from "@/shared/ui/shadcn/input";
import { Label } from "@/shared/ui/shadcn/label";

interface CreateIkohzaFormProps {
	facultyId: string;
	onSuccess?: () => void;
}

export function CreateIkohzaForm({
	facultyId,
	onSuccess,
}: CreateIkohzaFormProps) {
	const { mutate: createIkohza, isPending } = useCreateIkohza();

	const {
		register,
		handleSubmit,
		formState: { errors },
		reset,
	} = useForm<CreateIkohzaInput>({
		resolver: zodResolver(CreateIkohzaSchema),
		defaultValues: {
			facultyId,
		},
	});

	const onSubmit = (data: CreateIkohzaInput) => {
		createIkohza(data, {
			onSuccess: () => {
				toast.success("Ikohza created successfully");
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
				<Label htmlFor="code">Ikohza Code</Label>
				<Input id="code" {...register("code")} placeholder="e.g. CAIRO" />
				{errors.code && (
					<p className="text-red-500 text-sm">{errors.code.message}</p>
				)}
			</div>

			<div className="space-y-2">
				<Label htmlFor="name">Ikohza Name</Label>
				<Input
					id="name"
					{...register("name")}
					placeholder="e.g. Centre for AI and Robotics"
				/>
				{errors.name && (
					<p className="text-red-500 text-sm">{errors.name.message}</p>
				)}
			</div>

			<div className="space-y-2">
				<Label htmlFor="leaderName">Leader Name (Optional)</Label>
				<Input
					id="leaderName"
					{...register("leaderName")}
					placeholder="e.g. Prof. Dr. Ali"
				/>
				{errors.leaderName && (
					<p className="text-red-500 text-sm">{errors.leaderName.message}</p>
				)}
			</div>

			<Button disabled={isPending} type="submit">
				{isPending ? "Creating..." : "Create Ikohza"}
			</Button>
		</form>
	);
}
