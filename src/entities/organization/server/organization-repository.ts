import { db } from "@/shared/server/db";
import type {
	CreateBranchInput,
	CreateCompanyInput,
	CreateDepartmentInput,
	CreateFacultyInput,
	CreateIkohzaInput,
	UpdateBranchInput,
	UpdateCompanyInput,
	UpdateDepartmentInput,
	UpdateFacultyInput,
	UpdateIkohzaInput,
} from "../model/schema";
import type { CompanyWithBranches, FacultyWithRelations } from "../model/types";

// ===================== Faculty =====================

export async function getFaculties(): Promise<FacultyWithRelations[]> {
	return db.faculty.findMany({
		include: {
			departments: true,
			ikohzas: true,
		},
		orderBy: { name: "asc" },
	});
}

export async function getFacultyById(id: string) {
	return db.faculty.findUnique({ where: { id } });
}

export async function createFaculty(data: CreateFacultyInput) {
	return db.faculty.create({ data });
}

export async function updateFaculty(data: UpdateFacultyInput) {
	const { id, ...rest } = data;
	return db.faculty.update({ where: { id }, data: rest });
}

export async function deleteFaculty(id: string) {
	return db.faculty.delete({ where: { id } });
}

export async function getAffectedUsersByFaculty(facultyId: string) {
	const users = await db.user.findMany({
		where: { facultyId },
		select: { id: true, email: true, firstName: true, lastName: true },
	});
	return users.map((user) => ({
		id: user.id,
		email: user.email,
		name:
			user.firstName || user.lastName
				? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim()
				: null,
	}));
}

// ===================== Department =====================

export async function createDepartment(data: CreateDepartmentInput) {
	return db.department.create({ data });
}

export async function updateDepartment(data: UpdateDepartmentInput) {
	const { id, ...rest } = data;
	return db.department.update({ where: { id }, data: rest });
}

export async function deleteDepartment(id: string) {
	return db.department.delete({ where: { id } });
}

export async function getAffectedUsersByDepartment(departmentId: string) {
	const users = await db.user.findMany({
		where: { departmentId },
		select: { id: true, email: true, firstName: true, lastName: true },
	});
	return users.map((user) => ({
		id: user.id,
		email: user.email,
		name:
			user.firstName || user.lastName
				? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim()
				: null,
	}));
}

// ===================== Ikohza =====================

export async function createIkohza(data: CreateIkohzaInput) {
	return db.ikohza.create({ data });
}

export async function updateIkohza(data: UpdateIkohzaInput) {
	const { id, ...rest } = data;
	return db.ikohza.update({ where: { id }, data: rest });
}

export async function deleteIkohza(id: string) {
	return db.ikohza.delete({ where: { id } });
}

export async function getAffectedUsersByIkohza(ikohzaId: string) {
	const users = await db.user.findMany({
		where: { ikohzaId },
		select: { id: true, email: true, firstName: true, lastName: true },
	});
	return users.map((user) => ({
		id: user.id,
		email: user.email,
		name:
			user.firstName || user.lastName
				? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim()
				: null,
	}));
}

// ===================== Company =====================

export async function getCompanies(): Promise<CompanyWithBranches[]> {
	return db.company.findMany({
		include: { branches: true },
		orderBy: { name: "asc" },
	});
}

export async function createCompany(data: CreateCompanyInput) {
	return db.company.create({ data });
}

export async function updateCompany(data: UpdateCompanyInput) {
	const { id, ...rest } = data;
	return db.company.update({ where: { id }, data: rest });
}

export async function deleteCompany(id: string) {
	return db.company.delete({ where: { id } });
}

export async function getAffectedUsersByCompany(companyId: string) {
	const users = await db.user.findMany({
		where: { companyId },
		select: { id: true, email: true, firstName: true, lastName: true },
	});
	return users.map((user) => ({
		id: user.id,
		email: user.email,
		name:
			user.firstName || user.lastName
				? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim()
				: null,
	}));
}

// ===================== Branch =====================

export async function createBranch(data: CreateBranchInput) {
	return db.companyBranch.create({ data });
}

export async function updateBranch(data: UpdateBranchInput) {
	const { id, ...rest } = data;
	return db.companyBranch.update({ where: { id }, data: rest });
}

export async function deleteBranch(id: string) {
	return db.companyBranch.delete({ where: { id } });
}

export async function getAffectedUsersByBranch(branchId: string) {
	const users = await db.user.findMany({
		where: { companyBranchId: branchId },
		select: { id: true, email: true, firstName: true, lastName: true },
	});
	return users.map((user) => ({
		id: user.id,
		email: user.email,
		name:
			user.firstName || user.lastName
				? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim()
				: null,
	}));
}
