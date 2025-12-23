import { getAffectedUsersByBranch } from "@/entities/organization/server/organization-repository";
import { createProtectedHandler, forbidden } from "@/shared/lib/api-factory";

export const GET = createProtectedHandler(async (req, user) => {
	if (user.role !== "lab_administrator") return forbidden();

	const { searchParams } = new URL(req.url);
	const id = searchParams.get("id")?.trim();

	if (!id || id.length === 0) {
		return Response.json({ error: "Missing id" }, { status: 400 });
	}

	try {
		const users = await getAffectedUsersByBranch(id);
		return Response.json({ users });
	} catch (error) {
		console.error("Error fetching affected users by branch:", error);
		return Response.json({ error: "Internal Server Error" }, { status: 500 });
	}
});
