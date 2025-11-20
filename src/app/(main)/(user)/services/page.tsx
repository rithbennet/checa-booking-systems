import { getServices } from "@/entities/service/api/get-services";
import { mapRoleToUserType } from "@/shared/lib/user-type-mapper";
import { auth } from "@/shared/server/auth";
import { ServicesPage } from "@/widgets/services-page";

export default async function BrowseServices() {
	const session = await auth();
	const userType = mapRoleToUserType(session?.user?.role ?? null);

	// Fetch services server-side - small dataset, no need for API route
	const services = await getServices({
		filters: { userType },
	});

	return <ServicesPage initialServices={services} userType={userType} />;
}
