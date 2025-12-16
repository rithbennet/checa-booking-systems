/**
 * Onboarding Options Repository
 * Provides lookup data for onboarding form dropdowns
 */

import { db } from "@/shared/server/db";

// ==============================================================
// Types
// ==============================================================

export interface FacultyOption {
	id: string;
	code: string;
	name: string;
	isMjiit: boolean;
}

export interface DepartmentOption {
	id: string;
	code: string;
	name: string;
	facultyId: string;
}

export interface IkohzaOption {
	id: string;
	code: string;
	name: string;
	facultyId: string;
	leaderName: string | null;
}

export interface CompanyOption {
	id: string;
	name: string;
	legalName: string | null;
}

export interface CompanyBranchOption {
	id: string;
	name: string;
	companyId: string;
	address: string | null;
	city: string | null;
}

export interface OnboardingOptionsVM {
	faculties: FacultyOption[];
	departments: DepartmentOption[];
	ikohzas: IkohzaOption[];
	companies: CompanyOption[];
	companyBranches: CompanyBranchOption[];
}

// ==============================================================
// Query Functions
// ==============================================================

/**
 * Get all active faculties
 */
export async function getActiveFaculties(): Promise<FacultyOption[]> {
	const faculties = await db.faculty.findMany({
		where: { isActive: true },
		select: {
			id: true,
			code: true,
			name: true,
		},
		orderBy: { name: "asc" },
	});

	return faculties.map((f) => {
		const codeUpper = f.code.toUpperCase();
		const nameUpper = f.name.toUpperCase();
		// Check if faculty is MJIIT by code or name patterns
		const isMjiit =
			codeUpper === "MJIIT" ||
			nameUpper.includes("MJIIT") ||
			nameUpper.includes("MALAYSIA JAPANESE") ||
			nameUpper.includes("JAPANESE INSTITUTE");
		return {
			id: f.id,
			code: f.code,
			name: f.name,
			isMjiit,
		};
	});
}

/**
 * Get departments by faculty ID
 */
export async function getDepartmentsByFaculty(
	facultyId: string,
): Promise<DepartmentOption[]> {
	const departments = await db.department.findMany({
		where: {
			facultyId,
			isActive: true,
		},
		select: {
			id: true,
			code: true,
			name: true,
			facultyId: true,
		},
		orderBy: { name: "asc" },
	});

	return departments;
}

/**
 * Get all active departments
 */
export async function getAllDepartments(): Promise<DepartmentOption[]> {
	const departments = await db.department.findMany({
		where: { isActive: true },
		select: {
			id: true,
			code: true,
			name: true,
			facultyId: true,
		},
		orderBy: { name: "asc" },
	});

	return departments;
}

/**
 * Get ikohzas by faculty ID (typically only MJIIT has ikohzas)
 */
export async function getIkohzasByFaculty(
	facultyId: string,
): Promise<IkohzaOption[]> {
	const ikohzas = await db.ikohza.findMany({
		where: {
			facultyId,
			isActive: true,
		},
		select: {
			id: true,
			code: true,
			name: true,
			facultyId: true,
			leaderName: true,
		},
		orderBy: { name: "asc" },
	});

	return ikohzas;
}

/**
 * Get all active ikohzas
 */
export async function getAllIkohzas(): Promise<IkohzaOption[]> {
	const ikohzas = await db.ikohza.findMany({
		where: { isActive: true },
		select: {
			id: true,
			code: true,
			name: true,
			facultyId: true,
			leaderName: true,
		},
		orderBy: { name: "asc" },
	});

	return ikohzas;
}

/**
 * Get all active companies
 */
export async function getActiveCompanies(): Promise<CompanyOption[]> {
	const companies = await db.company.findMany({
		where: { isActive: true },
		select: {
			id: true,
			name: true,
			legalName: true,
		},
		orderBy: { name: "asc" },
	});

	return companies;
}

/**
 * Get branches by company ID
 */
export async function getBranchesByCompany(
	companyId: string,
): Promise<CompanyBranchOption[]> {
	const branches = await db.companyBranch.findMany({
		where: {
			companyId,
			isActive: true,
		},
		select: {
			id: true,
			name: true,
			companyId: true,
			address: true,
			city: true,
		},
		orderBy: { name: "asc" },
	});

	return branches;
}

/**
 * Get all active branches
 */
export async function getAllBranches(): Promise<CompanyBranchOption[]> {
	const branches = await db.companyBranch.findMany({
		where: { isActive: true },
		select: {
			id: true,
			name: true,
			companyId: true,
			address: true,
			city: true,
		},
		orderBy: { name: "asc" },
	});

	return branches;
}

/**
 * Get all onboarding options in one call (for initial form load)
 */
export async function getAllOnboardingOptions(): Promise<OnboardingOptionsVM> {
	const [faculties, departments, ikohzas, companies, companyBranches] =
		await Promise.all([
			getActiveFaculties(),
			getAllDepartments(),
			getAllIkohzas(),
			getActiveCompanies(),
			getAllBranches(),
		]);

	return {
		faculties,
		departments,
		ikohzas,
		companies,
		companyBranches,
	};
}

/**
 * Create a new company (for external users who don't find their company)
 * Returns company and branch ID if a branch was created
 */
export async function createCompany(data: {
	name: string;
	address?: string;
	branchName?: string;
}): Promise<CompanyOption & { branchId?: string }> {
	const company = await db.company.create({
		data: {
			name: data.name,
		},
		select: {
			id: true,
			name: true,
			legalName: true,
		},
	});

	// If address provided, create a branch with the provided name or default to "Main Office"
	let branchId: string | undefined;
	if (data.address) {
		const branch = await db.companyBranch.create({
			data: {
				companyId: company.id,
				name: data.branchName?.trim() || "Main Office",
				address: data.address,
			},
			select: {
				id: true,
			},
		});
		branchId = branch.id;
	}

	return {
		...company,
		...(branchId && { branchId }),
	};
}

/**
 * Create a new branch for an existing company
 */
export async function createCompanyBranch(data: {
	companyId: string;
	name: string;
	address?: string;
}): Promise<CompanyBranchOption> {
	const branch = await db.companyBranch.create({
		data: {
			companyId: data.companyId,
			name: data.name,
			address: data.address || null,
		},
		select: {
			id: true,
			name: true,
			companyId: true,
			address: true,
			city: true,
		},
	});

	return branch;
}
