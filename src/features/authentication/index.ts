/**
 * Authentication Feature
 *
 * Exports all public API for the authentication feature
 */

// Server Actions
export { login, loginWithGoogle } from "./lib/server-actions";
// Utilities
export {
	detectUserType,
	mapAuthError,
	resolveApiUserType,
	validateRegistrationForm,
} from "./lib/utils";
// Onboarding schemas
export {
	completeOnboardingSchema,
	externalMemberSchema,
	mjiitMemberSchema,
	profileEditSchema,
	utmMemberSchema,
} from "./model/onboarding-schema";
export type { RegistrationFormData, SignInFormData } from "./model/schemas";
// Types
export type { ApiUserType, AuthError, UserType } from "./model/types";
export { AuthFooter } from "./ui/AuthFooter";
export { AuthHeader } from "./ui/AuthHeader";
export { AuthLayout } from "./ui/AuthLayout";
export { OnboardingForm } from "./ui/OnboardingForm";
export { OnboardingWizard } from "./ui/OnboardingWizard";
export { RegisterForm } from "./ui/RegisterForm";
// UI Components
export { SignInForm } from "./ui/SignInForm";
export { SignOutModal } from "./ui/SignOutModal";
