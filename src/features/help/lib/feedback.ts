/**
 * Generate Airtable feedback form URL with prefilled user data
 */
export function generateFeedbackUrl(params: {
	userEmail: string;
	userRole: string;
	currentPageUrl?: string;
	subject?: string;
}): string {
	const baseUrl =
		"https://airtable.com/app1p61whYyD1QKRh/pagrAbtjcVgzDcCpL/form";

	const searchParams = new URLSearchParams();

	// Add user email
	searchParams.append("prefill_User email", params.userEmail);

	// Add user role (formatted)
	const formattedRole = params.userRole
		.replace(/_/g, " ")
		.replace(/\b\w/g, (c: string) => c.toUpperCase());
	searchParams.append("prefill_User Role", formattedRole);

	// Add subject if provided
	if (params.subject) {
		searchParams.append("prefill_Subject", params.subject);
	}

	// Add current page URL if provided
	if (params.currentPageUrl) {
		searchParams.append("prefill_Page Url", params.currentPageUrl);
	}

	return `${baseUrl}?${searchParams.toString()}`;
}
