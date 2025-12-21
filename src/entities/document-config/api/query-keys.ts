/**
 * Document Config Query Keys
 * React Query keys for document configuration
 */

export const documentConfigKeys = {
	all: ["document-config"] as const,
	global: () => [...documentConfigKeys.all, "global"] as const,
};
