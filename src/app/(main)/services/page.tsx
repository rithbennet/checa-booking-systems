import { ServicesPage } from "@/app/widgets/services-page";

export default function BrowseServices() {
  // TODO: Get user type from session/auth
  const userType = "mjiit_member" as const;

  return <ServicesPage userType={userType} />;
}
