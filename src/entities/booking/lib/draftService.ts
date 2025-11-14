/**
 * Draft persistence service for booking forms
 * Handles saving, loading, and clearing drafts from localStorage
 */

const storage = typeof window !== "undefined" ? window.localStorage : undefined;

/**
 * Generates a unique draft key for a booking
 * @param userId - The user ID
 * @param mode - "new" or "edit"
 * @param bookingId - Optional booking ID for edits
 * @returns A unique storage key
 */
export function draftKey(
  userId: string,
  mode: "new" | "edit",
  bookingId?: string
): string {
  return `booking-draft:${userId}:${mode}:${bookingId ?? "new"}`;
}

/**
 * Retrieves a draft from localStorage
 * @param key - The draft key
 * @returns The parsed draft or null if not found/invalid
 */
export function getDraft<T>(key: string): T | null {
  if (!storage) return null;
  const raw = storage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw, (_key, value) => {
      // Revive Date objects
      if (typeof value === "string") {
        const datePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
        if (datePattern.test(value)) {
          return new Date(value);
        }
      }
      return value;
    }) as T;
  } catch {
    return null;
  }
}

/**
 * Saves a draft to localStorage
 * @param key - The draft key
 * @param data - The draft data to save
 */
export function saveDraft<T>(key: string, data: T): void {
  if (!storage) return;
  try {
    storage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error("Failed to save draft:", error);
  }
}

/**
 * Clears a draft from localStorage
 * @param key - The draft key
 */
export function clearDraft(key: string): void {
  if (!storage) return;
  storage.removeItem(key);
}

/**
 * Clears all drafts for a specific user
 * @param userId - The user ID
 */
export function clearAllUserDrafts(userId: string): void {
  if (!storage) return;
  const prefix = `booking-draft:${userId}:`;
  const keysToRemove: string[] = [];

  // Find all keys for this user
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (key?.startsWith(prefix)) {
      keysToRemove.push(key);
    }
  }

  // Remove all matching keys
  for (const key of keysToRemove) {
    storage.removeItem(key);
  }
}
