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

			// Create audit log entry
			await db.auditLog.create({
				data: {
					userId: user.id,
					action: "analysis_result_deleted",
					entity: "AnalysisResult",
					entityId: resultId,
					metadata: {
						bookingId: booking.id,
						bookingReference: booking.referenceNumber,
						fileName: result.fileName,
						sampleTrackingId: result.sampleTrackingId,
					},
				},
			});

			return Response.json({
				success: true,
				message: "Analysis result deleted successfully",
			});
		} catch (error) {
			console.error("Error deleting analysis result:", error);
			return serverError("Failed to delete analysis result");
		}
	},
	{ requireActive: true },
);
