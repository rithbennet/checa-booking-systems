/**
 * Authentication utility functions
 */

export function detectUserType(email: string): "institutional" | "external" | null {
	if (
		email.includes("@utm.my") ||
		email.includes("@graduate.utm.my")
	) {
		return "institutional";
	}
	if (
		email &&
		!email.includes("@utm.my") &&
		!email.includes("@graduate.utm.my")
	) {
		return "external";
	}
	return null;
}

export function resolveApiUserType(
	userType: "institutional" | "external" | null,
): "utm_member" | "external_member" | null {
	if (userType === "institutional") return "utm_member";
	if (userType === "external") return "external_member";
	return null;
}

export function validateRegistrationForm(data: {
	email: string;
	firstName: string;
	lastName: string;
	password: string;
	confirmPassword: string;
	acceptedTerms: boolean;
	userType: "institutional" | "external" | null;
}): string | null {
	if (!data.email) return "Email is required";
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
		return "Enter a valid email";
	if (!data.firstName.trim()) return "First name is required";
	if (!data.lastName.trim()) return "Last name is required";
	if (data.password.length < 8)
		return "Password must be at least 8 characters";
	if (data.password !== data.confirmPassword) return "Passwords do not match";
	if (!data.acceptedTerms) return "You must accept the Terms & Privacy";
	const apiType = resolveApiUserType(data.userType);
	if (!apiType)
		return "Please enter a valid institutional or external email";
	return null;
}

export function mapAuthError(error?: string): string {
	if (!error) return "";
	switch (error) {
		case "CredentialsSignin":
		case "Invalid credentials":
			return "Invalid email or password.";
		case "Your account is pending admin approval.":
			return "Your account is pending admin approval. You can browse the app but cannot submit bookings yet.";
		case "Your account is not active.":
			return "Your account is not active.";
		default:
			return "Unable to sign in. Please try again.";
	}
}

