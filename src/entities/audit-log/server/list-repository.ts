import { db } from "@/shared/server/db";
import type { AuditLogListParams, AuditLogListResponse } from "../model/types";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

export async function getAuditLogs(
	params: AuditLogListParams = {},
): Promise<AuditLogListResponse> {
	const page = Math.max(1, params.page ?? 1);
	const pageSize = Math.min(
		Math.max(1, params.pageSize ?? DEFAULT_PAGE_SIZE),
		MAX_PAGE_SIZE,
	);
	const search = params.search?.trim();

	const where = search
		? {
				OR: [
					{ action: { contains: search, mode: "insensitive" as const } },
					{ entity: { contains: search, mode: "insensitive" as const } },
					{ entityId: { contains: search, mode: "insensitive" as const } },
					{
						user: {
							OR: [
								{
									firstName: { contains: search, mode: "insensitive" as const },
								},
								{
									lastName: { contains: search, mode: "insensitive" as const },
								},
								{ email: { contains: search, mode: "insensitive" as const } },
							],
						},
					},
				],
			}
		: {};

	const [logs, total] = await Promise.all([
		db.auditLog.findMany({
			where,
			orderBy: { createdAt: "desc" },
			skip: (page - 1) * pageSize,
			take: pageSize,
			include: {
				user: {
					select: {
						firstName: true,
						lastName: true,
						email: true,
					},
				},
			},
		}),
		db.auditLog.count({ where }),
	]);

	const items = logs.map((log) => {
		const nameParts = [log.user?.firstName, log.user?.lastName].filter(Boolean);
		const userName =
			nameParts.length > 0 ? nameParts.join(" ") : (log.user?.email ?? null);

		return {
			id: log.id,
			action: log.action,
			entity: log.entity,
			entityId: log.entityId,
			metadata: (log.metadata as Record<string, unknown> | null) ?? null,
			userId: log.userId,
			userName,
			userEmail: log.user?.email ?? null,
			createdAt: log.createdAt.toISOString(),
		};
	});

	return {
		items,
		total,
		page,
		pageSize,
	};
}
