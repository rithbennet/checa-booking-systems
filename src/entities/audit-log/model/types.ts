export interface AuditLogListItem {
	id: string;
	action: string;
	entity: string | null;
	entityId: string | null;
	metadata: Record<string, unknown> | null;
	userId: string | null;
	userName: string | null;
	userEmail: string | null;
	createdAt: string;
}

export interface AuditLogListParams {
	page?: number;
	pageSize?: number;
	search?: string;
}

export interface AuditLogListResponse {
	items: AuditLogListItem[];
	total: number;
	page: number;
	pageSize: number;
}
