import type { ReactNode } from "react";
import { AuthLayout } from "@/features/authentication";

export default function authLayout({
	children,
}: Readonly<{ children: ReactNode }>) {
	return <AuthLayout>{children}</AuthLayout>;
}
