import { FiltersSchema, type FiltersState } from "./filters.schema";

export function fromSearchParams(sp: URLSearchParams): FiltersState {
	const statusAll = sp.getAll("status");
	const obj: Record<string, unknown> = {
		page: sp.get("page") ?? undefined,
		pageSize: sp.get("pageSize") ?? undefined,
		sort: sp.get("sort") ?? undefined,
		q: sp.get("q") ?? undefined,
		type: sp.get("type") ?? undefined,
		createdFrom: sp.get("createdFrom") ?? undefined,
		createdTo: sp.get("createdTo") ?? undefined,
		status: statusAll.length > 0 ? statusAll : undefined,
	};
	const parsed = FiltersSchema.safeParse(obj);
	if (parsed.success) return parsed.data;
	// On error, return defaults
	return FiltersSchema.parse({});
}

export function toQuery(params: FiltersState): URLSearchParams {
	const sp = new URLSearchParams();
	if (params.page) sp.set("page", String(params.page));
	if (params.pageSize) sp.set("pageSize", String(params.pageSize));
	if (params.sort) sp.set("sort", params.sort);
	if (params.q) sp.set("q", params.q);
	if (params.type) sp.set("type", params.type);
	if (params.createdFrom) sp.set("createdFrom", params.createdFrom);
	if (params.createdTo) sp.set("createdTo", params.createdTo);
	if (params.status && params.status.length > 0) {
		for (const s of params.status) sp.append("status", s);
	}
	return sp;
}

export function buildHref(basePath: string, params: FiltersState): string {
	const sp = toQuery(params);
	const qs = sp.toString();
	return qs ? `${basePath}?${qs}` : basePath;
}
