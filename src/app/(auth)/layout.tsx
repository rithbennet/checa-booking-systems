import type React from "react";
import AuthFooter from "@/widgets/layout/AuthFooter";
import AuthHeader from "@/widgets/layout/AuthHeader";

export default function authLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	return (
		<div>
			<AuthHeader />
			{children}
			<AuthFooter />
		</div>
	);
}
