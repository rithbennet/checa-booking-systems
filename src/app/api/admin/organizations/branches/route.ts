import {
	CreateBranchSchema,
	UpdateBranchSchema,
} from "@/entities/organization/model/schema";
import {
	createBranch,
	deleteBranch,
	getAffectedUsersByBranch,
	updateBranch,
} from "@/entities/organization/server/organization-repository";
import { createProtectedHandler, forbidden } from "@/shared/lib/api-factory";
import { logger } from "@/shared/lib/logger";
import { sendOrganizationDeletedEmail } from "@/shared/server/email";

export const POST = createProtectedHandler(async (req, user) => {
	if (user.role !== "lab_administrator") return forbidden();

	const body = await req.json();
	const parsed = CreateBranchSchema.safeParse(body);

	if (!parsed.success) {
		return Response.json(
			{ error: "Invalid data", details: parsed.error },
			{ status: 400 },
		);
	}

	const result = await createBranch(parsed.data);
	return Response.json(result);
});

export const PUT = createProtectedHandler(async (req, user) => {
	if (user.role !== "lab_administrator") return forbidden();

	const body = await req.json();
	const parsed = UpdateBranchSchema.safeParse(body);

	if (!parsed.success) {
		return Response.json(
			{ error: "Invalid data", details: parsed.error },
			{ status: 400 },
		);
	}

	const result = await updateBranch(parsed.data);
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

	const affectedUsers = await getAffectedUsersByBranch(id);
	await deleteBranch(id);

	let failedEmailCount = 0;
	if (sendEmails && affectedUsers.length > 0) {
		const emailPromises = affectedUsers.map((affectedUser) =>
			sendOrganizationDeletedEmail({
				to: affectedUser.email,
				userName: affectedUser.name ?? "User",
				organizationType: "branch",
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
						organizationType: "branch",
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
