import {
	CreateFacultySchema,
	UpdateFacultySchema,
} from "@/entities/organization/model/schema";
import {
	createFaculty,
	deleteFaculty,
	getAffectedUsersByFaculty,
	getFaculties,
	updateFaculty,
} from "@/entities/organization/server/organization-repository";
import { createProtectedHandler, forbidden } from "@/shared/lib/api-factory";
import { logger } from "@/shared/lib/logger";
import { sendOrganizationDeletedEmail } from "@/shared/server/email";

export const GET = createProtectedHandler(async (_req, user) => {
	if (user.role !== "lab_administrator") return forbidden();
	const data = await getFaculties();
	return Response.json(data);
});

export const POST = createProtectedHandler(async (req, user) => {
	if (user.role !== "lab_administrator") return forbidden();

	const body = await req.json();
	const parsed = CreateFacultySchema.safeParse(body);

	if (!parsed.success) {
		return Response.json(
			{ error: "Invalid data", details: parsed.error },
			{ status: 400 },
		);
	}

	const result = await createFaculty(parsed.data);
	return Response.json(result);
});

export const PUT = createProtectedHandler(async (req, user) => {
	if (user.role !== "lab_administrator") return forbidden();

	const body = await req.json();
	const parsed = UpdateFacultySchema.safeParse(body);

	if (!parsed.success) {
		return Response.json(
			{ error: "Invalid data", details: parsed.error },
			{ status: 400 },
		);
	}

	const result = await updateFaculty(parsed.data);
	return Response.json(result);
});

export const DELETE = createProtectedHandler(async (req, user) => {
	if (user.role !== "lab_administrator") return forbidden();

	const { searchParams } = new URL(req.url);
	const id = searchParams.get("id")?.trim();
	const sendEmails = searchParams.get("sendEmails") === "true";

	if (!id || id.length === 0) {
		return Response.json({ error: "Missing id" }, { status: 400 });
	}

	// Get affected users before deletion
	const affectedUsers = await getAffectedUsersByFaculty(id);

	// Delete the faculty
	await deleteFaculty(id);

	// Send emails to affected users if requested
	let failedEmailCount = 0;
	if (sendEmails && affectedUsers.length > 0) {
		const emailPromises = affectedUsers.map((affectedUser) =>
			sendOrganizationDeletedEmail({
				to: affectedUser.email,
				userName: affectedUser.name ?? "User",
				organizationType: "faculty",
				userId: affectedUser.id,
			}),
		);
		const results = await Promise.allSettled(emailPromises);
		results.forEach((result, index) => {
			if (result.status === "rejected") {
				failedEmailCount++;
				const affectedUser = affectedUsers[index];
				logger.error(
					{
						email: affectedUser?.email,
						error: result.reason,
						organizationType: "faculty",
						organizationId: id,
					},
					"Failed to send organization deletion email",
				);
			}
		});
	}

	return Response.json({
		success: true,
		affectedCount: affectedUsers.length,
		failedEmailCount,
	});
});
