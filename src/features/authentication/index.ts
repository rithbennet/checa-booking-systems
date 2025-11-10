/**
 * Authentication Feature
 * 
 * Exports all public API for the authentication feature
 */

// UI Components
export { SignInForm } from "./ui/SignInForm";
export { RegisterForm } from "./ui/RegisterForm";
export { SignOutPage } from "./ui/SignOutPage";
export { SignOutModal } from "./ui/SignOutModal";
export { AuthHeader } from "./ui/AuthHeader";
export { AuthFooter } from "./ui/AuthFooter";
export { AuthLayout } from "./ui/AuthLayout";

// Server Actions
export { login, loginWithGoogle } from "./lib/server-actions";

// Utilities
export { detectUserType, resolveApiUserType, validateRegistrationForm, mapAuthError } from "./lib/utils";

// Types
export type { UserType, ApiUserType, AuthError } from "./model/types";
export type { SignInFormData, RegistrationFormData } from "./model/schemas";

