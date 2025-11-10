"use client";

import { useEffect, useState } from "react";
import { SignOutModal } from "./SignOutModal";

export function SignOutPage() {
	const [open, setOpen] = useState(false);

	useEffect(() => {
		// Open modal immediately when component mounts
		setOpen(true);
	}, []);

	return <SignOutModal onOpenChange={setOpen} open={open} />;
}
