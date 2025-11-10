import "@/shared/styles/globals.css";

import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { QueryProvider } from "@/shared/lib/query-client";

export const metadata: Metadata = {
	title: "ChECA Lab Service Portal",
	description: "Chemical Energy Conversion & Application Lab Service Booking System",
	icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
	subsets: ["latin"],
	variable: "--font-geist-sans",
});

export default function RootLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	return (
		<html className={`${geist.variable}`} lang="en">
			<body>
				<QueryProvider>{children}</QueryProvider>
			</body>
		</html>
	);
}
