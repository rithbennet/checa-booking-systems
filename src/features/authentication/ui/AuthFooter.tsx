export function AuthFooter() {
	return (
		<footer className="border-t bg-white">
			<div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-6 text-gray-600 text-sm sm:flex-row sm:px-6 lg:px-8">
				<p>© {new Date().getFullYear()} ChECA Lab Services, UTM - MJIIT.</p>
				<nav className="flex items-center gap-4">
					<a className="hover:text-blue-700" href="/services">
						Services
					</a>
					<a className="hover:text-blue-700" href="/booking">
						Booking
					</a>
					<a className="hover:text-blue-700" href="/signIn">
						Sign In
					</a>
					<a className="hover:text-blue-700" href="/register">
						Register
					</a>
				</nav>
			</div>
		</footer>
	);
}
