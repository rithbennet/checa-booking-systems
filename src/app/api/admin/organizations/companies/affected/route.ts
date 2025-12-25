import { getAffectedUsersByCompany } from "@/entities/organization/server/organization-repository";
import { createProtectedHandler, forbidden } from "@/shared/lib/api-factory";
import { logger } from "@/shared/lib/logger";

export const GET = createProtectedHandler(async (req, user) => {
	if (user.role !== "lab_administrator") return forbidden();

	const { searchParams } = new URL(req.url);
	const id = searchParams.get("id")?.trim();

	if (!id || id.length === 0) {
		return Response.json({ error: "Missing id" }, { status: 400 });
	}

	try {
		const users = await getAffectedUsersByCompany(id);
		return Response.json({ users });
	} catch (error) {
		logger.error(
			{ error, companyId: id },
			"Error fetching affected users by company",
		);
		return Response.json({ error: "Internal server error" }, { status: 500 });
	}
});
