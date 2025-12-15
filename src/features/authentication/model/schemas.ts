import { z } from "zod";

export const signInSchema = z.object({
	email: z.string().email("Please enter a valid email address"),
	password: z.string().min(1, "Password is required"),
});

export const registrationSchema = z
	.object({
		email: z.string().email("Please enter a valid email address"),
		firstName: z.string().min(1, "First name is required").trim(),
		lastName: z.string().min(1, "Last name is required").trim(),
		password: z.string().min(8, "Password must be at least 8 characters"),
		confirmPassword: z.string().min(1, "Please confirm your password"),
		acceptedTerms: z.boolean().refine((val) => val === true, {
			message: "You must accept the Terms & Privacy",
		}),
		phone: z.string().min(1, "Phone number is required").trim(),
		// Institutional fields (optional - can complete later)
		facultyId: z.string().optional(),
		departmentId: z.string().optional(),
		ikohzaId: z.string().optional(),
		academicType: z.enum(["student", "staff"]).optional(),
		userIdentifier: z.string().optional(),
		supervisorName: z.string().optional(),
		// External fields (optional - can complete later)
		companyId: z.string().optional(),
		companyBranchId: z.string().optional(),
		newCompanyName: z.string().optional(),
		newCompanyAddress: z.string().optional(),
		newCompanyBranchName: z.string().optional(),
		newBranchName: z.string().optional(),
		newBranchAddress: z.string().optional(),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords do not match",
		path: ["confirmPassword"],
	});

export type SignInFormData = z.infer<typeof signInSchema>;
export type RegistrationFormData = z.infer<typeof registrationSchema>;
