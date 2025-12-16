import { z } from "zod";

// ==============================================================
// Onboarding Form Schemas with Conditional Validation
// ==============================================================

/**
 * Base schema for common fields shared by all user types
 */
const baseOnboardingSchema = z.object({
	firstName: z.string().min(1, "First name is required").trim(),
	lastName: z.string().min(1, "Last name is required").trim(),
	phone: z.string().optional(),
	acceptedTerms: z.boolean().refine((val) => val === true, {
		message: "You must accept the Terms & Privacy",
	}),
});

/**
 * Academic type enum for internal users
 */
export const academicTypeEnum = z.enum(["student", "staff"]);
export type AcademicType = z.infer<typeof academicTypeEnum>;

/**
 * User type enum for the system
 */
export const userTypeEnum = z.enum([
	"mjiit_member",
	"utm_member",
	"external_member",
]);
export type SystemUserType = z.infer<typeof userTypeEnum>;

/**
 * Schema for MJIIT members (internal users from MJIIT faculty)
 * - Faculty is always MJIIT
 * - Requires both Department and iKohza selection
 * - Student requires supervisor name
 */
export const mjiitMemberSchema = baseOnboardingSchema.extend({
	userType: z.literal("mjiit_member"),
	facultyId: z.string().uuid("Please select a faculty"),
	departmentId: z.string().uuid("Please select a department"),
	ikohzaId: z.string().uuid("Please select an iKohza"),
	academicType: academicTypeEnum,
	userIdentifier: z.string().min(1, "Matric number or staff ID is required"),
	supervisorName: z.string().optional(),
});

/**
 * Schema for UTM members (internal users from non-MJIIT faculties)
 * - Any faculty except MJIIT
 * - Shows Department selection
 * - Student requires supervisor name
 */
export const utmMemberSchema = baseOnboardingSchema.extend({
	userType: z.literal("utm_member"),
	facultyId: z.string().uuid("Please select a faculty"),
	departmentId: z.string().uuid("Please select a department"),
	academicType: academicTypeEnum,
	userIdentifier: z.string().min(1, "Matric number or staff ID is required"),
	supervisorName: z.string().optional(),
});

/**
 * Schema for external members (users from outside UTM)
 * - Company/organization info required
 */
export const externalMemberSchema = baseOnboardingSchema.extend({
	userType: z.literal("external_member"),
	companyId: z.string().uuid("Please select or create a company").optional(),
	companyBranchId: z.string().uuid("Please select a branch").optional(),
	// For new company creation
	newCompanyName: z.string().optional(),
	newCompanyAddress: z.string().optional(),
});

/**
 * Discriminated union schema for all user types
 * Using userType as the discriminator
 */
export const onboardingFormSchema = z.discriminatedUnion("userType", [
	mjiitMemberSchema,
	utmMemberSchema,
	externalMemberSchema,
]);

export type OnboardingFormData = z.infer<typeof onboardingFormSchema>;
export type MjiitMemberFormData = z.infer<typeof mjiitMemberSchema>;
export type UtmMemberFormData = z.infer<typeof utmMemberSchema>;
export type ExternalMemberFormData = z.infer<typeof externalMemberSchema>;

// ==============================================================
// Refinements with Custom Validation
// ==============================================================

/**
 * MJIIT member schema with supervisor validation
 * Supervisor is required when academicType is "student"
 */
export const mjiitMemberWithSupervisorSchema = mjiitMemberSchema.refine(
	(data) => {
		if (data.academicType === "student") {
			return (
				data.supervisorName !== undefined &&
				data.supervisorName.trim().length > 0
			);
		}
		return true;
	},
	{
		message: "Supervisor name is required for students",
		path: ["supervisorName"],
	},
);

/**
 * UTM member schema with supervisor validation
 * Supervisor is required when academicType is "student"
 */
export const utmMemberWithSupervisorSchema = utmMemberSchema.refine(
	(data) => {
		if (data.academicType === "student") {
			return (
				data.supervisorName !== undefined &&
				data.supervisorName.trim().length > 0
			);
		}
		return true;
	},
	{
		message: "Supervisor name is required for students",
		path: ["supervisorName"],
	},
);

/**
 * External member schema with company validation
 * Either companyId or newCompanyName must be provided
 */
export const externalMemberWithCompanySchema = externalMemberSchema.refine(
	(data) => {
		return (
			(data.companyId && data.companyId.length > 0) ||
			(data.newCompanyName && data.newCompanyName.trim().length > 0)
		);
	},
	{
		message: "Please select or enter a company name",
		path: ["companyId"],
	},
);

/**
 * Complete onboarding form schema with all refinements
 * This combines the discriminated union with refinements
 */
export const completeOnboardingSchema = z.union([
	mjiitMemberWithSupervisorSchema,
	utmMemberWithSupervisorSchema,
	externalMemberWithCompanySchema,
]);

export type CompleteOnboardingData = z.infer<typeof completeOnboardingSchema>;

// ==============================================================
// Profile Edit Schema (subset of onboarding, allows updates)
// ==============================================================

/**
 * Schema for editing profile information
 * Less strict than onboarding - allows partial updates
 */
export const profileEditSchema = z.object({
	firstName: z.string().min(1, "First name is required").trim().optional(),
	lastName: z.string().min(1, "Last name is required").trim().optional(),
	phone: z.string().optional(),
	userIdentifier: z.string().optional(),
	supervisorName: z.string().optional(),
	facultyId: z.string().uuid().optional().nullable(),
	departmentId: z.string().uuid().optional().nullable(),
	ikohzaId: z.string().uuid().optional().nullable(),
	companyId: z.string().uuid().optional().nullable(),
	companyBranchId: z.string().uuid().optional().nullable(),
	academicType: academicTypeEnum.optional(),
});

export type ProfileEditData = z.infer<typeof profileEditSchema>;
