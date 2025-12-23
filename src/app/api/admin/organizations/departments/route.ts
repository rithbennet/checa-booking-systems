import {
	CreateDepartmentSchema,
	UpdateDepartmentSchema,
} from "@/entities/organization/model/schema";
import {
	createDepartment,
	deleteDepartment,
	getAffectedUsersByDepartment,
	updateDepartment,
} from "@/entities/organization/server/organization-repository";
import { createProtectedHandler, forbidden } from "@/shared/lib/api-factory";
import { sendOrganizationDeletedEmail } from "@/shared/server/email";

export const POST = createProtectedHandler(async (req, user) => {
	if (user.role !== "lab_administrator") return forbidden();

	const body = await req.json();
	const parsed = CreateDepartmentSchema.safeParse(body);

	if (!parsed.success) {
		return Response.json(
			{ error: "Invalid data", details: parsed.error },
			{ status: 400 },
		);
	}

	const result = await createDepartment(parsed.data);
	return Response.json(result);
});

export const PUT = createProtectedHandler(async (req, user) => {
	if (user.role !== "lab_administrator") return forbidden();

	const body = await req.json();
	const parsed = UpdateDepartmentSchema.safeParse(body);

	if (!parsed.success) {
		return Response.json(
			{ error: "Invalid data", details: parsed.error },
			{ status: 400 },
		);
	}

	const result = await updateDepartment(parsed.data);
	return Response.json(result);
});

export const DELETE = createProtectedHandler(async (req, user) => {
	if (user.role !== "lab_administrator") return forbidden();

	const { searchParams } = new URL(req.url);
	const id = searchParams.get("id");
	const sendEmails = searchParams.get("sendEmails") === "true";

	if (!id) {
		return Response.json({ error: "Missing id" }, { status: 400 });
	}

	const affectedUsers = await getAffectedUsersByDepartment(id);
	await deleteDepartment(id);

	if (sendEmails && affectedUsers.length > 0) {
		const emailPromises = affectedUsers.map((affectedUser) =>
			sendOrganizationDeletedEmail({
				to: affectedUser.email,
				userName: `${affectedUser.firstName} ${affectedUser.lastName}`,
				organizationType: "department",
				userId: affectedUser.id,
			}),
		);
		const results = await Promise.allSettled(emailPromises);
		results.forEach((result, index) => {
			if (result.status === "rejected") {
				const user = affectedUsers[index];
				console.error(
					`Failed to send email to ${user?.email || "unknown"}:`,
					result.reason,
				);
			}
		});
	}

	return Response.json({ success: true, affectedCount: affectedUsers.length });
});
