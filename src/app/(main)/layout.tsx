import { redirect } from "next/navigation";
import { auth } from "@/shared/server/auth";
import {
	SidebarInset,
	SidebarProvider,
} from "@/shared/ui/shadcn/sidebar";
import CollapsibleSidebar from "@/widgets/layout/CollapsibleSidebar";
import Footer from "@/widgets/layout/Footer";

export default async function mainLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	const session = await auth();
	if (!session?.user) {
		redirect("/signIn");
	}

	return (
		<SidebarProvider>
			<CollapsibleSidebar session={session} />
			<SidebarInset className="flex flex-col">
				<main className="flex-1 overflow-auto">
					{/* Pass session to children via context or props */}
					{children}
				</main>
				<Footer />
			</SidebarInset>
		</SidebarProvider>
	);
}
