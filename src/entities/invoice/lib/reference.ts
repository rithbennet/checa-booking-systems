/**
 * Invoice reference helpers
 */

/**
 * Generate a temporary client-side reference (preview only).
 * Pattern: CHECA/YYYYMMDD/HHmm-<base36 4 chars>
 */
export function generateTempReference(): string {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  const datePart = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(
    now.getDate()
  )}`;
  const timePart = `${pad(now.getHours())}${pad(now.getMinutes())}`;
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `CHECA/${datePart}/${timePart}-${random}`;
}
