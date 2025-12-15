"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UserStatus, UserType } from "../model/types";
import { userKeys } from "./query-keys";

/**
 * Extracts error message from API response JSON.
 * Handles both { error: string } and { error: { message: string } } formats.
 */
function extractErrorMessage(json: unknown, fallbackMessage: string): string {
	try {
		if (typeof json === "object" && json !== null) {
			const obj = json as Record<string, unknown>;
			if (typeof obj.error === "string") {
				return obj.error;
			}
			if (
				typeof obj.error === "object" &&
				obj.error !== null &&
				"message" in obj.error
			) {
				return String(obj.error.message);
			}
			if (typeof obj.message === "string") {
				return obj.message;
			}
		}
		return fallbackMessage;
	} catch {
		return fallbackMessage;
	}
}

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
				const json = await res.json().catch(() => ({}));
				const errorMessage = extractErrorMessage(
					json,
					"Failed to update user status",
				);
				throw new Error(errorMessage);
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
				const json = await res.json().catch(() => ({}));
				const errorMessage = extractErrorMessage(
					json,
					"Failed to approve user",
				);
				throw new Error(errorMessage);
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
				const json = await res.json().catch(() => ({}));
				const errorMessage = extractErrorMessage(json, "Failed to reject user");
				throw new Error(errorMessage);
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
				const json = await res.json().catch(() => ({}));
				const errorMessage = extractErrorMessage(
					json,
					"Failed to update user type",
				);
				throw new Error(errorMessage);
			}

			return res.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: userKeys.all });
		},
	});
}
