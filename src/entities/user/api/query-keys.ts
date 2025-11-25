import type { UserListFilters } from "../model/types";

export const userKeys = {
	all: ["users"] as const,
	list: (params: Partial<UserListFilters>) =>
		[...userKeys.all, "list", params] as const,
	detail: (id: string) => [...userKeys.all, "detail", id] as const,
	counts: () => [...userKeys.all, "counts"] as const,
};
