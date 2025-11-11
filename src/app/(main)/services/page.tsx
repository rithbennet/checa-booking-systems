import { mapRoleToUserType } from "@/shared/lib/user-type-mapper";
import { auth } from "@/shared/server/auth";
import { ServicesPage } from "@/widgets/services-page";

export default async function BrowseServices() {
	const session = await auth();
	const userType = mapRoleToUserType(session?.user?.role ?? null);

	return <ServicesPage userType={userType} />;
}
