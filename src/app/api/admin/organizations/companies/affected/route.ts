import { getAffectedUsersByCompany } from "@/entities/organization/server/organization-repository";
import { createProtectedHandler, forbidden } from "@/shared/lib/api-factory";

export const GET = createProtectedHandler(async (req, user) => {
	if (user.role !== "lab_administrator") return forbidden();

	const { searchParams } = new URL(req.url);
	const id = searchParams.get("id");

	if (!id) {
		return Response.json({ error: "Missing id" }, { status: 400 });
	}

	const users = await getAffectedUsersByCompany(id);
	return Response.json({ users });
});
