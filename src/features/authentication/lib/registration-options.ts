/**
 * Hardcoded registration options
 * These are used in the registration form before users have access to the full database
 */

export const REGISTRATION_FACULTIES = [
	{ id: "engineering", name: "Faculty of Engineering" },
	{ id: "science", name: "Faculty of Science" },
	{ id: "management", name: "Faculty of Management" },
	{ id: "computing", name: "Faculty of Computing" },
	{
		id: "mjiit",
		name: "Malaysia Japanese International Institute of Technology",
	},
] as const;

export const REGISTRATION_DEPARTMENTS = [
	{ id: "chemical", name: "Chemical Engineering", facultyId: "engineering" },
	{
		id: "mechanical",
		name: "Mechanical Engineering",
		facultyId: "engineering",
	},
	{
		id: "electrical",
		name: "Electrical Engineering",
		facultyId: "engineering",
	},
	{ id: "civil", name: "Civil Engineering", facultyId: "engineering" },
	{ id: "chemistry", name: "Chemistry", facultyId: "science" },
	{ id: "physics", name: "Physics", facultyId: "science" },
	{ id: "mathematics", name: "Mathematics", facultyId: "science" },
	{ id: "business", name: "Business Administration", facultyId: "management" },
	{ id: "accounting", name: "Accounting", facultyId: "management" },
	{ id: "cs", name: "Computer Science", facultyId: "computing" },
	{ id: "it", name: "Information Technology", facultyId: "computing" },
	// MJIIT departments
	{
		id: "mjiit-electrical",
		name: "Electrical Engineering",
		facultyId: "mjiit",
	},
	{
		id: "mjiit-mechanical",
		name: "Mechanical Engineering",
		facultyId: "mjiit",
	},
	{ id: "mjiit-chemical", name: "Chemical Engineering", facultyId: "mjiit" },
	{ id: "mjiit-civil", name: "Civil Engineering", facultyId: "mjiit" },
] as const;

export const REGISTRATION_IKOHZAS = [
	{ id: "ikohza-1", name: "iKohza 1", facultyId: "mjiit" },
	{ id: "ikohza-2", name: "iKohza 2", facultyId: "mjiit" },
	{ id: "ikohza-3", name: "iKohza 3", facultyId: "mjiit" },
] as const;

export type RegistrationFacultyId =
	(typeof REGISTRATION_FACULTIES)[number]["id"];
export type RegistrationDepartmentId =
	(typeof REGISTRATION_DEPARTMENTS)[number]["id"];
export type RegistrationIkohzaId = (typeof REGISTRATION_IKOHZAS)[number]["id"];

/**
 * Check if a faculty is MJIIT
 */
export function isMjiitFaculty(facultyId: string): boolean {
	return facultyId === "mjiit";
}

/**
 * Get departments for a specific faculty
 */
export function getDepartmentsForFaculty(
	facultyId: string,
): Array<{ id: string; name: string }> {
	return REGISTRATION_DEPARTMENTS.filter(
		(dept) => dept.facultyId === facultyId,
	);
}

/**
 * Get ikohzas for a specific faculty
 */
export function getIkohzasForFaculty(
	facultyId: string,
): Array<{ id: string; name: string }> {
	return REGISTRATION_IKOHZAS.filter(
		(ikohza) => ikohza.facultyId === facultyId,
	);
}
