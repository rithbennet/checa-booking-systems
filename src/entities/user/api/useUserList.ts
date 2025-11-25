"use client";

import { useQuery } from "@tanstack/react-query";
import type {
	UserListFilters,
	UserListItemVM,
	UserStatusCounts,
} from "../model/types";
import { userKeys } from "./query-keys";

interface UserListResponse {
	items: UserListItemVM[];
	total: number;
}

export function useUserList(params: UserListFilters) {
	return useQuery<UserListResponse>({
		queryKey: userKeys.list(params),
		queryFn: async () => {
			const searchParams = new URLSearchParams();
			searchParams.set("page", String(params.page));
			searchParams.set("pageSize", String(params.pageSize));
			searchParams.set("sort", params.sort);

			if (params.query) {
				searchParams.set("q", params.query);
			}
			if (params.status) {
				searchParams.set("status", params.status);
			}
			if (params.userType && params.userType !== "all") {
				searchParams.set("userType", params.userType);
			}

			const res = await fetch(`/api/admin/users?${searchParams.toString()}`);
			if (!res.ok) {
				throw new Error("Failed to fetch users");
			}
			return res.json();
		},
	});
}

export function useUserCounts() {
	return useQuery<UserStatusCounts>({
		queryKey: userKeys.counts(),
		queryFn: async () => {
			const res = await fetch("/api/admin/users/counts");
			if (!res.ok) {
				throw new Error("Failed to fetch user counts");
			}
			return res.json();
		},
	});
}
