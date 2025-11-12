/**
 * Equipment fetching hooks have been removed in favor of server-side preloading.
 * This placeholder remains to provide a clear error if legacy imports persist.
 */

export const equipmentKeys = {
  all: ["equipment"] as const,
};

export function useAvailableEquipment(): never {
  throw new Error(
    "useAvailableEquipment has been removed. Please rely on server-provided equipment props."
  );
}
