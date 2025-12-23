"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useUpdateIkohza } from "@/entities/organization/api";
import {
	type UpdateIkohzaInput,
	UpdateIkohzaSchema,
} from "@/entities/organization/model/schema";
import { Button } from "@/shared/ui/shadcn/button";
import { Input } from "@/shared/ui/shadcn/input";
import { Label } from "@/shared/ui/shadcn/label";
import { Textarea } from "@/shared/ui/shadcn/textarea";

interface EditIkohzaFormProps {
	ikohza: {
		id: string;
		code: string;
		name: string;
		description: string | null;
		leaderName: string | null;
	};
	onSuccess?: () => void;
}

export function EditIkohzaForm({ ikohza, onSuccess }: EditIkohzaFormProps) {
	const { mutate: updateIkohza, isPending } = useUpdateIkohza();

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<UpdateIkohzaInput>({
		resolver: zodResolver(UpdateIkohzaSchema),
		defaultValues: {
			id: ikohza.id,
			code: ikohza.code,
			name: ikohza.name,
			description: ikohza.description ?? undefined,
			leaderName: ikohza.leaderName ?? undefined,
		},
	});

	const onSubmit = (data: UpdateIkohzaInput) => {
		updateIkohza(data, {
			onSuccess: () => {
				toast.success("Ikohza updated successfully");
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
				<Label htmlFor="code">Ikohza Code</Label>
				<Input id="code" {...register("code")} />
				{errors.code && (
					<p className="text-red-500 text-sm">{errors.code.message}</p>
				)}
			</div>

			<div className="space-y-2">
				<Label htmlFor="name">Ikohza Name</Label>
				<Input id="name" {...register("name")} />
				{errors.name && (
					<p className="text-red-500 text-sm">{errors.name.message}</p>
				)}
			</div>

			<div className="space-y-2">
				<Label htmlFor="description">Description (Optional)</Label>
				<Textarea id="description" {...register("description")} rows={3} />
				{errors.description && (
					<p className="text-red-500 text-sm">{errors.description.message}</p>
				)}
			</div>

			<div className="space-y-2">
				<Label htmlFor="leaderName">Leader Name (Optional)</Label>
				<Input id="leaderName" {...register("leaderName")} />
				{errors.leaderName && (
					<p className="text-red-500 text-sm">{errors.leaderName.message}</p>
				)}
			</div>

			<Button className="w-full" disabled={isPending} type="submit">
				{isPending ? "Updating..." : "Update Ikohza"}
			</Button>
		</form>
	);
}
