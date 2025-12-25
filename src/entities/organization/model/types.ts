import type {
	Company,
	CompanyBranch,
	Department,
	Faculty,
	Ikohza,
} from "generated/prisma";

export type { Faculty, Department, Ikohza, Company, CompanyBranch };

export interface FacultyWithRelations extends Faculty {
	departments: Department[];
	ikohzas: Ikohza[];
}

export interface CompanyWithBranches extends Company {
	branches: CompanyBranch[];
}
