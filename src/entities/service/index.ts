/**
 * Service entity public API
 *
 * Note: Server-side API functions (get-services.ts) are NOT exported here
 * to prevent client-side imports. Import them directly from the file if needed.
 *
 * Note: Client-side hooks (use-services.ts) are deprecated since we fetch
 * services server-side. Services are passed as props to components.
 */

// Admin hooks
export * from "./api";
export * from "./lib/utils";
export * from "./model/admin-types";
export * from "./model/query-keys";
// Re-export only specific types from types.ts to avoid conflicts with admin-types.ts
export type {
	Service,
	ServiceAddOn,
	ServiceFilters,
	ServicePricing,
	ServiceSortOption,
	ServiceWithPricing,
	UserType,
} from "./model/types";

// Server-side functions should be imported directly:
// import { getServices } from "@/entities/service/api/get-services";
// import { getAdminServices, getAdminServiceDetail } from "@/entities/service/server/admin-repository";
// import { upsertAdminService, toggleServiceActive } from "@/entities/service/server/admin-actions";
