import { FlaskConical } from "lucide-react";
import Link from "next/link";

export function AuthHeader() {
	return (
		<header className="border-b bg-white">
			<div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
				<Link className="flex items-center gap-3" href="/">
					<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
						<FlaskConical className="h-5 w-5 text-white" />
					</div>
					<div>
						<p className="font-bold text-base text-gray-900 leading-tight">
							ChECA Lab
						</p>
						<p className="text-gray-600 text-xs">Service Portal</p>
					</div>
				</Link>
				<nav className="hidden items-center gap-4 text-sm sm:flex">
					<Link
						className="font-medium text-blue-600 hover:text-blue-800"
						href="/signIn"
					>
						Sign In
					</Link>
					<Link className="text-gray-700 hover:text-blue-700" href="/register">
						Register
					</Link>
				</nav>
			</div>
		</header>
	);
}
