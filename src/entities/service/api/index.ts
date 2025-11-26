/**
 * Service API Barrel Export
 */

// Admin hooks
export {
	useAdminServiceDetail,
	useAdminServices,
	useToggleServiceActive,
	useUpsertService,
} from "./use-admin-services";

// Server-side API functions should be imported directly:
// import { getServices } from "@/entities/service/api/get-services";
