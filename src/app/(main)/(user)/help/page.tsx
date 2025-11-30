"use client";

import {
	BookOpen,
	Calendar,
	DollarSign,
	FileText,
	FlaskConical,
	HelpCircle,
	Mail,
	Phone,
} from "lucide-react";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/shared/ui/shadcn/accordion";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/shared/ui/shadcn/card";

const faqs = [
	{
		category: "Getting Started",
		icon: BookOpen,
		questions: [
			{
				question: "How do I create a booking?",
				answer:
					"Navigate to 'Browse Services' from the sidebar, select the service you need, and click 'Book Now'. Follow the wizard to provide your details, upload required documents, and submit your booking for review.",
			},
			{
				question: "What happens after I submit a booking?",
				answer:
					"After submission, your booking enters 'Pending Review' status. Our lab administrators will review your request and either approve it, reject it, or request modifications. You'll receive a notification when the status changes.",
			},
			{
				question: "How long does the approval process take?",
				answer:
					"Typical approval time is 1-3 business days, depending on the complexity of your request and current workload. You can track your booking status from 'My Bookings' page.",
			},
		],
	},
	{
		category: "Services & Samples",
		icon: FlaskConical,
		questions: [
			{
				question: "What types of services are available?",
				answer:
					"We offer various analytical services including chemical analysis, material characterization, spectroscopy, chromatography, and more. Visit 'Browse Services' to see the full catalog with detailed descriptions and pricing.",
			},
			{
				question: "How do I prepare my samples?",
				answer:
					"Sample preparation requirements vary by service. Each service listing includes specific preparation guidelines. If you're unsure, contact us before submission to ensure your samples meet the requirements.",
			},
			{
				question: "How can I track my sample status?",
				answer:
					"Go to 'Results' from the sidebar to see all your samples and their current status. You'll see statuses like 'Pending', 'Received', 'In Analysis', and 'Analysis Complete'.",
			},
		],
	},
	{
		category: "Payments & Invoices",
		icon: DollarSign,
		questions: [
			{
				question: "How do I pay for services?",
				answer:
					"Once your booking is approved and an invoice is generated, go to 'Financials' to view your invoices. Click 'Upload Proof' to submit your payment proof (bank transfer receipt, etc.). The admin will verify your payment.",
			},
			{
				question: "What payment methods are accepted?",
				answer:
					"We accept bank transfers and internal fund transfers (for UTM/MJIIT members). Payment details will be provided in your invoice.",
			},
			{
				question: "Why can't I download my results?",
				answer:
					"Results download is only available after your payment has been verified. Please check your payment status in 'Financials' and ensure it shows 'Paid/Verified'.",
			},
		],
	},
	{
		category: "Booking Management",
		icon: Calendar,
		questions: [
			{
				question: "Can I modify my booking after submission?",
				answer:
					"If the admin requests modifications, you can make changes from the booking details page. Once approved, modifications are limited. Contact the lab for urgent changes.",
			},
			{
				question: "How do I cancel a booking?",
				answer:
					"You can request cancellation from the booking details page if it hasn't been processed yet. Cancellations may be subject to policies depending on the booking stage.",
			},
			{
				question: "What do the booking statuses mean?",
				answer:
					"• Pending Review: Awaiting admin review\n• Revision Requested: Admin needs changes\n• Approved: Ready for processing\n• In Progress: Being processed\n• Completed: Finished and results available\n• Rejected/Cancelled: Not proceeding",
			},
		],
	},
	{
		category: "Results & Reports",
		icon: FileText,
		questions: [
			{
				question: "How do I download my analysis results?",
				answer:
					"Go to 'Results' from the sidebar. For samples with 'Analysis Complete' status, click the download button. Remember, download is only available after payment verification.",
			},
			{
				question: "What file formats are results provided in?",
				answer:
					"Results are typically provided in PDF format for reports, along with raw data files in formats appropriate to the analysis type (CSV, Excel, spectral data formats, etc.).",
			},
			{
				question: "Can I request a reanalysis?",
				answer:
					"If you have concerns about your results, contact the lab administrator. Depending on the situation, we may offer reanalysis or clarification. Additional fees may apply.",
			},
		],
	},
];

const contactInfo = {
	email: "checa@utm.my",
	phone: "+60 7-555 5000",
	hours: "Monday - Friday, 9:00 AM - 5:00 PM",
	location:
		"Chemical Engineering Centralised Analytical Laboratory (ChECA), MJIIT, UTM",
};

export default function HelpPage() {
	return (
		<div className="space-y-6 p-6">
			{/* Page Header */}
			<div>
				<h1 className="font-bold text-2xl text-slate-900">Help & Support</h1>
				<p className="text-muted-foreground text-sm">
					Find answers to common questions or contact us for assistance
				</p>
			</div>

			{/* Contact Cards */}
			<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="flex items-center gap-2 text-base">
							<Mail className="size-4 text-blue-600" />
							Email Us
						</CardTitle>
					</CardHeader>
					<CardContent>
						<a
							className="font-medium text-blue-600 hover:underline"
							href={`mailto:${contactInfo.email}`}
						>
							{contactInfo.email}
						</a>
						<p className="mt-1 text-muted-foreground text-sm">
							We typically respond within 24 hours
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="flex items-center gap-2 text-base">
							<Phone className="size-4 text-green-600" />
							Call Us
						</CardTitle>
					</CardHeader>
					<CardContent>
						<a
							className="font-medium text-green-600 hover:underline"
							href={`tel:${contactInfo.phone.replace(/\s/g, "")}`}
						>
							{contactInfo.phone}
						</a>
						<p className="mt-1 text-muted-foreground text-sm">
							{contactInfo.hours}
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="flex items-center gap-2 text-base">
							<HelpCircle className="size-4 text-purple-600" />
							Visit Us
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="font-medium text-slate-900">{contactInfo.location}</p>
						<p className="mt-1 text-muted-foreground text-sm">
							Walk-in consultations available
						</p>
					</CardContent>
				</Card>
			</div>

			{/* FAQ Section */}
			<Card>
				<CardHeader>
					<CardTitle>Frequently Asked Questions</CardTitle>
					<CardDescription>
						Click on any question to see the answer
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-6">
						{faqs.map((category) => {
							const Icon = category.icon;
							return (
								<div key={category.category}>
									<div className="mb-3 flex items-center gap-2">
										<Icon className="size-5 text-slate-600" />
										<h3 className="font-semibold text-slate-900">
											{category.category}
										</h3>
									</div>
									<Accordion className="w-full" collapsible type="single">
										{category.questions.map((faq) => (
											<AccordionItem
												key={faq.question}
												value={`${category.category}-${faq.question}`}
											>
												<AccordionTrigger className="text-left text-sm hover:no-underline">
													{faq.question}
												</AccordionTrigger>
												<AccordionContent className="whitespace-pre-line text-slate-600 text-sm">
													{faq.answer}
												</AccordionContent>
											</AccordionItem>
										))}
									</Accordion>
								</div>
							);
						})}
					</div>
				</CardContent>
			</Card>

			{/* Still Need Help */}
			<Card className="bg-slate-50">
				<CardHeader className="text-center">
					<CardTitle>Still need help?</CardTitle>
					<CardDescription>
						Our team is here to assist you with any questions or issues
					</CardDescription>
				</CardHeader>
				<CardContent className="text-center">
					<a
						className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2 font-medium text-white transition-colors hover:bg-blue-700"
						href={`mailto:${contactInfo.email}?subject=Support Request`}
					>
						<Mail className="size-4" />
						Contact Support
					</a>
				</CardContent>
			</Card>
		</div>
	);
}
