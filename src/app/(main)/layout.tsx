import { requireCurrentUser } from "@/shared/server/current-user";
import { SidebarInset, SidebarProvider } from "@/shared/ui/shadcn/sidebar";
import { Toaster } from "@/shared/ui/shadcn/sonner";
import CollapsibleSidebar from "@/widgets/layout/CollapsibleSidebar";
import Footer from "@/widgets/layout/Footer";

export default async function mainLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	const currentUser = await requireCurrentUser();

	return (
		<SidebarProvider>
			<CollapsibleSidebar session={currentUser} />
			<SidebarInset className="flex flex-col">
				<main className="flex-1 overflow-auto">
					{/* Pass session to children via context or props */}
					{children}
				</main>
				<Footer />
			</SidebarInset>
			<Toaster position="top-right" richColors />
		</SidebarProvider>
	);
}
