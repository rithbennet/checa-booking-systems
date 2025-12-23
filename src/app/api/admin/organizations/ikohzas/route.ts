import {
	CreateIkohzaSchema,
	UpdateIkohzaSchema,
} from "@/entities/organization/model/schema";
import {
	createIkohza,
	deleteIkohza,
	getAffectedUsersByIkohza,
	getFacultyById,
	updateIkohza,
} from "@/entities/organization/server/organization-repository";
import { createProtectedHandler, forbidden } from "@/shared/lib/api-factory";
import { sendOrganizationDeletedEmail } from "@/shared/server/email";

const MJIIT_FACULTY_CODE = "MJIIT";

export const POST = createProtectedHandler(async (req, user) => {
	if (user.role !== "lab_administrator") return forbidden();

	const body = await req.json();
	const parsed = CreateIkohzaSchema.safeParse(body);

	if (!parsed.success) {
		return Response.json(
			{ error: "Invalid data", details: parsed.error },
			{ status: 400 },
		);
	}

	// Check if the faculty is MJIIT - only MJIIT can have ikohzas
	const faculty = await getFacultyById(parsed.data.facultyId);
	if (!faculty || faculty.code.toUpperCase() !== MJIIT_FACULTY_CODE) {
		return Response.json(
			{ error: "Ikohzas can only be added to MJIIT faculty" },
			{ status: 400 },
		);
	}

	const result = await createIkohza(parsed.data);
	return Response.json(result);
});

export const PUT = createProtectedHandler(async (req, user) => {
	if (user.role !== "lab_administrator") return forbidden();

	const body = await req.json();
	const parsed = UpdateIkohzaSchema.safeParse(body);

	if (!parsed.success) {
		return Response.json(
			{ error: "Invalid data", details: parsed.error },
			{ status: 400 },
		);
	}

	const result = await updateIkohza(parsed.data);
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

	const affectedUsers = await getAffectedUsersByIkohza(id);
	await deleteIkohza(id);

	if (sendEmails && affectedUsers.length > 0) {
		const emailPromises = affectedUsers.map((affectedUser) =>
			sendOrganizationDeletedEmail({
				to: affectedUser.email,
				userName: `${affectedUser.firstName} ${affectedUser.lastName}`,
				organizationType: "ikohza",
				userId: affectedUser.id,
			}),
		);
		await Promise.all(emailPromises);
	}

	return Response.json({ success: true, affectedCount: affectedUsers.length });
});
