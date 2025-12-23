/**
 * Analysis Result Management API Route
 *
 * DELETE /api/admin/samples/results/[resultId] - Delete an analysis result file
 */

import {
	createProtectedHandler,
	forbidden,
	notFound,
	serverError,
} from "@/shared/lib/api-factory";
import { logAuditEvent } from "@/shared/lib/audit-log";
import { logger } from "@/shared/lib/logger";
import { db } from "@/shared/server/db";

export const DELETE = createProtectedHandler(
	async (_req, user, { params }) => {
		if (user.role !== "lab_administrator") {
			return forbidden("Only administrators can delete analysis results");
		}

		const resultId = params?.resultId;
		if (!resultId) {
			return notFound("Result ID is required");
		}

		try {
			// Find the result to get booking info for audit log
			const result = await db.analysisResult.findUnique({
				where: { id: resultId },
				include: {
					sampleTracking: {
						include: {
							bookingServiceItem: {
								include: {
									bookingRequest: {
										select: {
											id: true,
											referenceNumber: true,
										},
									},
								},
							},
						},
					},
				},
			});

			if (!result) {
				return notFound("Analysis result not found");
			}

			const booking = result.sampleTracking.bookingServiceItem.bookingRequest;

			// Delete the analysis result
			await db.analysisResult.delete({
				where: { id: resultId },
			});

			// Log audit event (fire-and-forget)
			void logAuditEvent({
				userId: user.id,
				action: "sample.result.delete",
				entity: "analysis_result",
				entityId: resultId,
				metadata: {
					bookingId: booking.id,
					bookingReference: booking.referenceNumber,
					fileName: result.fileName,
					sampleTrackingId: result.sampleTrackingId,
				},
			}).catch((error) => {
				logger.error(
					{ error, resultId },
					"Failed to log audit event for analysis result deletion",
				);
			});

			return Response.json({
				success: true,
				message: "Analysis result deleted successfully",
			});
		} catch (error) {
			logger.error({ error, resultId }, "Error deleting analysis result");
			return serverError("Failed to delete analysis result");
		}
	},
	{ requireActive: true },
);
