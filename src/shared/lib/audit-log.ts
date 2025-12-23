import type { Prisma } from "@/generated/prisma";
import { db } from "@/shared/server/db";
import { logger } from "./logger";

export interface AuditLogParams {
	userId: string | null;
	action: string;
	entity?: string;
	entityId?: string;
	metadata?: Record<string, unknown>;
}

/**
 * Log an audit event to both application logs (Pino) and database (AuditLog)
 *
 * This function ensures audit events are:
 * 1. Logged to application logs for operational visibility
 * 2. Stored in the database for compliance and activity monitoring
 * 3. Never fail the main operation if audit logging fails
 *
 * @param params - Audit log parameters
 * @returns Promise that resolves when logging is complete (or failed silently)
 */
export async function logAuditEvent(params: AuditLogParams): Promise<void> {
	// Log to application logs (Pino) first
	logger.info(
		{
			type: "audit",
			userId: params.userId,
			action: params.action,
			entity: params.entity,
			entityId: params.entityId,
			metadata: params.metadata,
		},
		`Audit: ${params.action}`,
	);

	// Log to database (AuditLog)
	try {
		await db.auditLog.create({
			data: {
				userId: params.userId,
				action: params.action,
				entity: params.entity,
				entityId: params.entityId,
				metadata: (params.metadata || {}) as Prisma.InputJsonValue,
			},
		});
	} catch (error) {
		// Don't fail the main operation if audit log fails
		// Log the error separately so we know audit logging failed
		logger.error(
			{
				error,
				auditParams: params,
			},
			"Failed to create audit log",
		);
	}
}
