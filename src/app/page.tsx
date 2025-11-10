import {
	ArrowRight,
	BarChart3,
	CheckCircle2,
	FileText,
	FlaskConical,
	Lock,
	Shield,
	Users,
	Zap,
} from "lucide-react";
import Link from "next/link";
import { getSession } from "@/shared/server/better-auth/server";
import { Button } from "@/shared/ui/shadcn/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/shared/ui/shadcn/card";

export default async function Home() {
	const session = await getSession();

	const features = [
		{
			icon: FlaskConical,
			title: "Multi-Service Booking",
			description:
				"Combine analysis services and working space in a single booking with consolidated pricing.",
		},
		{
			icon: Users,
			title: "Role-Based Pricing",
			description:
				"Automatic pricing based on your role - UTM members, external users, and administrators.",
		},
		{
			icon: BarChart3,
			title: "Sample Tracking",
			description:
				"Real-time visibility into your sample status from submission to results delivery.",
		},
		{
			icon: Lock,
			title: "Secure Results Portal",
			description:
				"Access your analysis results securely with payment-gated release and historical access.",
		},
		{
			icon: FileText,
			title: "Document Management",
			description:
				"Streamlined workflow for service forms, signatures, invoices, and payment proofs.",
		},
		{
			icon: Zap,
			title: "Automated Notifications",
			description:
				"Stay informed with email and in-app notifications for all workflow updates.",
		},
	];

	const benefits = [
		"Unified booking system for all lab services",
		"Post-approval modification workflow",
		"Consolidated service forms with offline signatures",
		"Manual financial workflow with verifiable proofs",
		"Comprehensive audit trail",
		"Role-based access and pricing",
	];

	return (
		<div className="flex min-h-screen flex-col">
			{/* Hero Section */}
			<section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 py-20 sm:py-32">
				<div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
					<div className="mx-auto max-w-4xl text-center">
						<div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-white/80 px-4 py-2 text-sm backdrop-blur-sm">
							<FlaskConical className="h-4 w-4 text-blue-600" />
							<span className="font-medium text-gray-700">
								ChECA Lab Service Portal
							</span>
						</div>
						<h1 className="mb-6 font-extrabold text-4xl text-gray-900 tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
							Chemical Energy Conversions &{" "}
							<span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
								Applications Lab
							</span>
						</h1>
						<p className="mb-8 text-gray-600 text-lg sm:text-xl md:text-2xl">
							Digitize your lab service requests with our comprehensive booking
							management system. From registration to results delivery—all in
							one platform.
						</p>
						<div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
							{session ? (
								<>
									<Button asChild className="h-12 px-8 text-base" size="lg">
										<Link href="/dashboard">
											Go to Dashboard
											<ArrowRight className="ml-2 h-5 w-5" />
										</Link>
									</Button>
									<Button
										asChild
										className="h-12 px-8 text-base"
										size="lg"
										variant="outline"
									>
										<Link href="/services">Browse Services</Link>
									</Button>
								</>
							) : (
								<>
									<Button asChild className="h-12 px-8 text-base" size="lg">
										<Link href="/register">
											Get Started
											<ArrowRight className="ml-2 h-5 w-5" />
										</Link>
									</Button>
									<Button
										asChild
										className="h-12 px-8 text-base"
										size="lg"
										variant="outline"
									>
										<Link href="/signIn">Sign In</Link>
									</Button>
								</>
							)}
						</div>
					</div>
				</div>
				{/* Decorative elements */}
				<div className="-z-0 absolute inset-0">
					<div className="absolute top-1/4 left-1/4 h-64 w-64 rounded-full bg-blue-200/30 blur-3xl" />
					<div className="absolute right-1/4 bottom-1/4 h-64 w-64 rounded-full bg-indigo-200/30 blur-3xl" />
				</div>
			</section>

			{/* Features Section */}
			<section className="py-20 sm:py-24">
				<div className="container mx-auto px-4 sm:px-6 lg:px-8">
					<div className="mx-auto mb-16 max-w-2xl text-center">
						<h2 className="mb-4 font-bold text-3xl text-gray-900 sm:text-4xl">
							Everything you need to manage lab services
						</h2>
						<p className="text-gray-600 text-lg">
							Streamline your workflow with powerful features designed for
							researchers, administrators, and external partners.
						</p>
					</div>
					<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
						{features.map((feature, index) => {
							const Icon = feature.icon;
							return (
								<Card
									className="group border-gray-200 transition-all hover:border-blue-300 hover:shadow-lg"
									key={feature.title}
									style={{
										animationDelay: `${index * 100}ms`,
									}}
								>
									<CardHeader>
										<div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-600 transition-transform group-hover:scale-110">
											<Icon className="h-6 w-6" />
										</div>
										<CardTitle className="text-xl">{feature.title}</CardTitle>
									</CardHeader>
									<CardContent>
										<CardDescription className="text-base">
											{feature.description}
										</CardDescription>
									</CardContent>
								</Card>
							);
						})}
					</div>
				</div>
			</section>

			{/* Benefits Section */}
			<section className="bg-gray-50 py-20 sm:py-24">
				<div className="container mx-auto px-4 sm:px-6 lg:px-8">
					<div className="mx-auto max-w-4xl">
						<div className="mb-12 text-center">
							<h2 className="mb-4 font-bold text-3xl text-gray-900 sm:text-4xl">
								Why choose ChECA Lab Portal?
							</h2>
							<p className="text-gray-600 text-lg">
								Experience a seamless, professional workflow designed to save
								time and reduce errors.
							</p>
						</div>
						<div className="grid gap-4 sm:grid-cols-2">
							{benefits.map((benefit, index) => (
								<div
									className="flex items-start gap-3 rounded-lg bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
									key={benefit}
									style={{
										animationDelay: `${index * 50}ms`,
									}}
								>
									<CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
									<p className="text-gray-700">{benefit}</p>
								</div>
							))}
						</div>
					</div>
				</div>
			</section>

			{/* CTA Section */}
			<section className="bg-gradient-to-r from-blue-600 to-indigo-600 py-20 sm:py-24">
				<div className="container mx-auto px-4 sm:px-6 lg:px-8">
					<div className="mx-auto max-w-3xl text-center">
						<div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm backdrop-blur-sm">
							<Shield className="h-4 w-4 text-white" />
							<span className="text-white">Secure & Reliable</span>
						</div>
						<h2 className="mb-4 font-bold text-3xl text-white sm:text-4xl">
							Ready to streamline your lab service requests?
						</h2>
						<p className="mb-8 text-blue-100 text-lg">
							Join researchers, administrators, and partners who trust ChECA Lab
							Portal for their service management needs.
						</p>
						<div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
							{session ? (
								<Button
									asChild
									className="h-12 px-8 text-base"
									size="lg"
									variant="secondary"
								>
									<Link href="/dashboard">
										Go to Dashboard
										<ArrowRight className="ml-2 h-5 w-5" />
									</Link>
								</Button>
							) : (
								<>
									<Button
										asChild
										className="h-12 px-8 text-base"
										size="lg"
										variant="secondary"
									>
										<Link href="/register">
											Create Account
											<ArrowRight className="ml-2 h-5 w-5" />
										</Link>
									</Button>
									<Button
										asChild
										className="h-12 border-white/20 bg-white/10 px-8 text-base text-white hover:bg-white/20"
										size="lg"
										variant="outline"
									>
										<Link href="/signIn">Sign In</Link>
									</Button>
								</>
							)}
						</div>
					</div>
				</div>
			</section>

			{/* Footer */}
			<footer className="border-t bg-white py-12">
				<div className="container mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
						<div className="flex items-center gap-3">
							<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
								<FlaskConical className="h-5 w-5 text-white" />
							</div>
							<div>
								<p className="font-bold text-base text-gray-900 leading-tight">
									ChECA Lab
								</p>
								<p className="text-gray-600 text-xs">Service Portal</p>
							</div>
						</div>
						<p className="text-gray-600 text-sm">
							© {new Date().getFullYear()} ChECA Lab Services, UTM - MJIIT. All
							rights reserved.
						</p>
					</div>
				</div>
			</footer>
		</div>
	);
}
