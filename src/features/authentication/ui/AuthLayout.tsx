import type { ReactNode } from "react";
import { AuthFooter } from "./AuthFooter";
import { AuthHeader } from "./AuthHeader";

export function AuthLayout({ children }: { children: ReactNode }) {
	return (
		<div>
			<AuthHeader />
			{children}
			<AuthFooter />
		</div>
	);
}

