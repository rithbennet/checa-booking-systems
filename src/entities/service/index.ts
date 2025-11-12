/**
 * Service entity public API
 *
 * Note: Server-side API functions (get-services.ts) are NOT exported here
 * to prevent client-side imports. Import them directly from the file if needed.
 *
 * Note: Client-side hooks (use-services.ts) are deprecated since we fetch
 * services server-side. Services are passed as props to components.
 */

export * from "./lib/utils";
export * from "./model/types";

// Server-side functions should be imported directly:
// import { getServices } from "@/entities/service/api/get-services";
