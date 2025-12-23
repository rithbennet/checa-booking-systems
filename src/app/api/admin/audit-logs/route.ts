import { getAuditLogs } from "@/entities/audit-log/server/list-repository";
import { createProtectedHandler, forbidden } from "@/shared/lib/api-factory";

export const GET = createProtectedHandler(async (req, user) => {
	if (user.role !== "lab_administrator") {
		return forbidden();
	}

	const { searchParams } = new URL(req.url);
	const pageParam = Number(searchParams.get("page"));
	const pageSizeParam = Number(searchParams.get("pageSize"));
	const search = searchParams.get("search") ?? undefined;

	const logs = await getAuditLogs({
		page: Number.isFinite(pageParam) ? pageParam : 1,
		pageSize: Number.isFinite(pageSizeParam) ? pageSizeParam : undefined,
		search: search?.trim() || undefined,
	});

	return Response.json(logs);
});
