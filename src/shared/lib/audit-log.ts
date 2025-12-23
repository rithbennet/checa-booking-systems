import type { Prisma } from "@/generated/prisma";
import { db } from "@/shared/server/db";
import { logger } from "./logger";

/**
 * Sanitize metadata to ensure it's JSON-serializable.
 * Handles BigInt, Date, undefined, functions, and circular references.
 */
function sanitizeMetadata(
	data: Record<string, unknown>,
): Record<string, unknown> {
	try {
		return JSON.parse(
			JSON.stringify(data, (_key, value) => {
				// Convert BigInt to string
				if (typeof value === "bigint") {
					return value.toString();
				}
				// Convert Date to ISO string
				if (value instanceof Date) {
					return value.toISOString();
				}
				// Remove functions
				if (typeof value === "function") {
					return undefined;
				}
				return value;
			}),
		);
	} catch (error) {
		logger.error(
			{ error, dataKeys: Object.keys(data) },
			"Failed to sanitize audit metadata - possible circular reference",
		);
		// Return a safe fallback with error indication
		return {
			_sanitizationError: true,
			_originalKeys: Object.keys(data),
		};
	}
}

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
		const sanitizedMetadata = sanitizeMetadata(params.metadata || {});
		await db.auditLog.create({
			data: {
				userId: params.userId,
				action: params.action,
				entity: params.entity,
				entityId: params.entityId,
				metadata: sanitizedMetadata as Prisma.InputJsonValue,
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
