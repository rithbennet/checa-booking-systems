import { z } from "zod";

export const CreateFacultySchema = z.object({
	code: z.string().min(1, "Code is required").max(50),
	name: z.string().min(1, "Name is required").max(200),
});

export const UpdateFacultySchema = z.object({
	id: z.string().uuid(),
	code: z.string().min(1, "Code is required").max(50),
	name: z.string().min(1, "Name is required").max(200),
});

export const CreateDepartmentSchema = z.object({
	facultyId: z.string().uuid(),
	code: z.string().min(1, "Code is required").max(50),
	name: z.string().min(1, "Name is required").max(200),
});

export const UpdateDepartmentSchema = z.object({
	id: z.string().uuid(),
	code: z.string().min(1, "Code is required").max(50),
	name: z.string().min(1, "Name is required").max(200),
});

export const CreateIkohzaSchema = z.object({
	facultyId: z.string().uuid(),
	code: z.string().min(1, "Code is required").max(50),
	name: z.string().min(1, "Name is required").max(200),
	description: z.string().max(1000).optional(),
	leaderName: z.string().max(200).optional(),
});

export const UpdateIkohzaSchema = z.object({
	id: z.string().uuid(),
	code: z.string().min(1, "Code is required").max(50),
	name: z.string().min(1, "Name is required").max(200),
	description: z.string().max(1000).optional(),
	leaderName: z.string().max(200).optional(),
});

export const CreateCompanySchema = z.object({
	name: z.string().min(1, "Name is required").max(200),
	legalName: z.string().optional(),
	regNo: z.string().optional(),
});

export const UpdateCompanySchema = z.object({
	id: z.string().uuid(),
	name: z.string().min(1, "Name is required").max(200),
	legalName: z.string().optional(),
	regNo: z.string().optional(),
});

export const CreateBranchSchema = z.object({
	companyId: z.string().uuid(),
	name: z.string().min(1, "Name is required").max(200),
	address: z.string().max(500).optional(),
	city: z.string().max(100).optional(),
	state: z.string().max(100).optional(),
	postcode: z.string().max(20).optional(),
	country: z.string().max(100).optional(),
	phone: z.string().max(20).optional(),
});

export const UpdateBranchSchema = z.object({
	id: z.string().uuid(),
	name: z.string().min(1, "Name is required").max(200),
	address: z.string().max(500).optional(),
	city: z.string().max(100).optional(),
	state: z.string().max(100).optional(),
	postcode: z.string().max(20).optional(),
	country: z.string().max(100).optional(),
	phone: z.string().max(20).optional(),
});

export type CreateFacultyInput = z.infer<typeof CreateFacultySchema>;
export type UpdateFacultyInput = z.infer<typeof UpdateFacultySchema>;
export type CreateDepartmentInput = z.infer<typeof CreateDepartmentSchema>;
export type UpdateDepartmentInput = z.infer<typeof UpdateDepartmentSchema>;
export type CreateIkohzaInput = z.infer<typeof CreateIkohzaSchema>;
export type UpdateIkohzaInput = z.infer<typeof UpdateIkohzaSchema>;
export type CreateCompanyInput = z.infer<typeof CreateCompanySchema>;
export type UpdateCompanyInput = z.infer<typeof UpdateCompanySchema>;
export type CreateBranchInput = z.infer<typeof CreateBranchSchema>;
export type UpdateBranchInput = z.infer<typeof UpdateBranchSchema>;
