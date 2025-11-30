/**
 * Base Email Layout
 * Provides consistent styling for all ChECA email templates
 */

import {
	Body,
	Container,
	Head,
	Hr,
	Html,
	Preview,
	Section,
	Text,
} from "@react-email/components";

interface BaseLayoutProps {
	preview: string;
	children: React.ReactNode;
}

export function BaseLayout({ preview, children }: BaseLayoutProps) {
	return (
		<Html>
			<Head />
			<Preview>{preview}</Preview>
			<Body style={main}>
				<Container style={container}>
					<Section style={header}>
						<Text style={logoText}>ChECA Lab</Text>
						<Text style={subtitle}>
							Chemical Engineering & Chemistry Analytical Laboratory
						</Text>
					</Section>
					<Hr style={hr} />
					<Section style={content}>{children}</Section>
					<Hr style={hr} />
					<Section style={footer}>
						<Text style={footerText}>ChECA Lab - MJIIT, UTM Kuala Lumpur</Text>
						<Text style={footerText}>
							This is an automated message. Please do not reply directly to this
							email.
						</Text>
					</Section>
				</Container>
			</Body>
		</Html>
	);
}

// Styles
const main = {
	backgroundColor: "#f6f9fc",
	fontFamily:
		'-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
};

const container = {
	backgroundColor: "#ffffff",
	margin: "0 auto",
	padding: "20px 0 48px",
	marginBottom: "64px",
	maxWidth: "600px",
};

const header = {
	padding: "24px 32px",
	textAlign: "center" as const,
};

const logoText = {
	fontSize: "28px",
	fontWeight: "bold" as const,
	color: "#1e3a8a",
	margin: "0",
};

const subtitle = {
	fontSize: "12px",
	color: "#64748b",
	margin: "4px 0 0",
};

const hr = {
	borderColor: "#e6ebf1",
	margin: "0",
};

const content = {
	padding: "32px",
};

const footer = {
	padding: "24px 32px",
	textAlign: "center" as const,
};

const footerText = {
	color: "#8898aa",
	fontSize: "12px",
	lineHeight: "16px",
	margin: "0",
};

export default BaseLayout;
