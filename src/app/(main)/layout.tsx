import { redirect } from "next/navigation";
import { auth } from "@/shared/server/auth";
import Footer from "@/widgets/layout/Footer";
import MainNav from "@/widgets/layout/MainNav";
import SidebarNav from "@/widgets/layout/SidebarNav";

export default async function mainLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	const session = await auth();
	if (!session?.user) {
		redirect("/signIn");
	}

	const user = session.user;

	return (
		<div>
			<MainNav session={session} />
			{user.role === "lab_administrator" ? (
				<SidebarNav session={session} />
			) : null}
			{children}
			<Footer />
		</div>
	);
}
