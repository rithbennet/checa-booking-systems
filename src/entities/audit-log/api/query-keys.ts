import type { AuditLogListParams } from "../model/types";

export const auditLogKeys = {
	all: ["audit-log"] as const,
	list: (params: Partial<AuditLogListParams> = {}) =>
		[...auditLogKeys.all, "list", params] as const,
};
