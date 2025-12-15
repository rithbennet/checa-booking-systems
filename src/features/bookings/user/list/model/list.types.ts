import type { SortKey } from "./filters.schema";

export type RowViewModel = {
	id: string;
	reference: string;
	projectTitle: string;
	status: string;
	amountLabel: string; // formatted or "—"
	createdAtLabel: string;
	flags: {
		hasWorkingSpace: boolean;
		hasUnread: boolean;
		hasOverdueInvoice: boolean;
	};
	nextRequiredAction?: string;
};

export type FiltersState = {
	page: number;
	pageSize: number;
	sort: SortKey;
	q?: string;
	status?: string[];
	createdFrom?: string;
	createdTo?: string;
	type?: "all" | "analysis_only" | "working_space";
};
