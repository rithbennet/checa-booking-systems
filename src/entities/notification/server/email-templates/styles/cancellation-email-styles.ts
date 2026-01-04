/**
 * Shared Cancellation Email Styles
 * Common styles used across booking cancellation email templates
 */

export const heading = {
	fontSize: "24px",
	fontWeight: "bold" as const,
	color: "#dc2626",
	marginBottom: "24px",
};

export const paragraph = {
	fontSize: "14px",
	lineHeight: "24px",
	color: "#475569",
	margin: "16px 0",
};

export const labelText = {
	fontSize: "12px",
	fontWeight: "600" as const,
	color: "#64748b",
	textTransform: "uppercase" as const,
	letterSpacing: "0.5px",
	marginBottom: "4px",
};

export const reasonText = {
	fontSize: "14px",
	lineHeight: "20px",
	color: "#334155",
	backgroundColor: "#f8fafc",
	padding: "12px",
	borderRadius: "6px",
	borderLeft: "3px solid #dc2626",
	margin: "8px 0 16px 0",
};

export const button = {
	backgroundColor: "#0f172a",
	borderRadius: "8px",
	color: "#fff",
	fontSize: "14px",
	fontWeight: "600" as const,
	textDecoration: "none",
	textAlign: "center" as const,
	display: "block",
	padding: "12px 24px",
	margin: "24px 0",
};
