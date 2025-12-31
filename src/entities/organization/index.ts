/**
 * Organization entity public API
 */

// API hooks
export * from "./api";
// Types
export type {
	Company,
	CompanyBranch,
	CompanyWithBranches,
	Department,
	Faculty,
	FacultyWithRelations,
	Ikohza,
	UtmCampus,
} from "./model/types";

// Server
export * from "./server";
