"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UserStatus, UserType } from "../model/types";
import { userKeys } from "./query-keys";

interface UpdateUserStatusInput {
	userId: string;
	status: UserStatus;
	reason?: string;
}

export function useUpdateUserStatus() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (input: UpdateUserStatusInput) => {
			const res = await fetch(`/api/admin/users/${input.userId}/status`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					status: input.status,
					reason: input.reason,
				}),
			});

			if (!res.ok) {
				const error = await res.json();
				throw new Error(error.message || "Failed to update user status");
			}

			return res.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: userKeys.all });
		},
	});
}

interface ApproveUserInput {
	userId: string;
}

export function useApproveUser() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (input: ApproveUserInput) => {
			const res = await fetch(`/api/admin/users/${input.userId}/approve`, {
				method: "POST",
			});

			if (!res.ok) {
				const error = await res.json();
				throw new Error(error.message || "Failed to approve user");
			}

			return res.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: userKeys.all });
		},
	});
}

interface RejectUserInput {
	userId: string;
	reason?: string;
}

export function useRejectUser() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (input: RejectUserInput) => {
			const res = await fetch(`/api/admin/users/${input.userId}/reject`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ reason: input.reason }),
			});

			if (!res.ok) {
				const error = await res.json();
				throw new Error(error.message || "Failed to reject user");
			}

			return res.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: userKeys.all });
		},
	});
}

interface UpdateUserTypeInput {
	userId: string;
	userType: UserType;
}

export function useUpdateUserType() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (input: UpdateUserTypeInput) => {
			const res = await fetch(`/api/admin/users/${input.userId}/type`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ userType: input.userType }),
			});

			if (!res.ok) {
				const error = await res.json();
				throw new Error(error.message || "Failed to update user type");
			}

			return res.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: userKeys.all });
		},
	});
}
