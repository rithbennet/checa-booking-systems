import {
	CreateCompanySchema,
	UpdateCompanySchema,
} from "@/entities/organization/model/schema";
import {
	createCompany,
	deleteCompany,
	getAffectedUsersByCompany,
	getCompanies,
	updateCompany,
} from "@/entities/organization/server/organization-repository";
import { createProtectedHandler, forbidden } from "@/shared/lib/api-factory";
import { sendOrganizationDeletedEmail } from "@/shared/server/email";

export const GET = createProtectedHandler(async (_req, user) => {
	if (user.role !== "lab_administrator") return forbidden();
	const data = await getCompanies();
	return Response.json(data);
});

export const POST = createProtectedHandler(async (req, user) => {
	if (user.role !== "lab_administrator") return forbidden();

	const body = await req.json();
	const parsed = CreateCompanySchema.safeParse(body);

	if (!parsed.success) {
		return Response.json(
			{ error: "Invalid data", details: parsed.error },
			{ status: 400 },
		);
	}

	const result = await createCompany(parsed.data);
	return Response.json(result);
});

export const PUT = createProtectedHandler(async (req, user) => {
	if (user.role !== "lab_administrator") return forbidden();

	const body = await req.json();
	const parsed = UpdateCompanySchema.safeParse(body);

	if (!parsed.success) {
		return Response.json(
			{ error: "Invalid data", details: parsed.error },
			{ status: 400 },
		);
	}

	const result = await updateCompany(parsed.data);
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

	const affectedUsers = await getAffectedUsersByCompany(id);
	await deleteCompany(id);

	if (sendEmails && affectedUsers.length > 0) {
		const emailPromises = affectedUsers.map((affectedUser) =>
			sendOrganizationDeletedEmail({
				to: affectedUser.email,
				userName: `${affectedUser.firstName} ${affectedUser.lastName}`,
				organizationType: "company",
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
