/**
 * Utility functions for workspace booking form
 */

import { addDays, differenceInDays } from "date-fns";
import type {
  CreateBookingInput,
  WorkspaceBookingInput,
} from "@/entities/booking/model/schemas";

type ServiceItem = NonNullable<CreateBookingInput["serviceItems"]>[number];

export interface WorkspaceDates {
  startDate?: Date;
  endDate?: Date;
}

/** ------------------ Helper utilities ------------------ **/

const normalize = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const matchISODate = (text: string, key: string): Date | undefined => {
  const match = text.match(new RegExp(`${key}:([^|]+)`));
  return match?.[1] ? new Date(match[1]) : undefined;
};

/** ------------------ Core date parsing & building ------------------ **/

/**
 * Parse workspace booking dates from service item notes.
 * Supports format: START_DATE:ISO||END_DATE:ISO
 */
export function parseWorkspaceDates(
  serviceItem: Partial<ServiceItem> | Partial<WorkspaceBookingInput>
): WorkspaceDates {
  // If caller passed an object with explicit startDate/endDate (WorkspaceBookingInput), prefer those
  const asWorkspace = serviceItem as Partial<WorkspaceBookingInput>;
  if (
    asWorkspace.startDate instanceof Date &&
    asWorkspace.endDate instanceof Date
  ) {
    return { startDate: asWorkspace.startDate, endDate: asWorkspace.endDate };
  }

  const notes = (serviceItem.notes as string) || "";
  const startDate = matchISODate(notes, "START_DATE");
  const endDate = matchISODate(notes, "END_DATE");

  if (startDate && endDate) return { startDate, endDate };

  // Note: duration-based fallbacks were removed — workspace bookings must provide explicit start/end dates
  return {};
}

/** Compute end date for N months (30 days each). */
export function calculateWorkspaceEndDate(
  startDate: Date,
  months: number
): Date {
  return addDays(startDate, months * 30 - 1);
}

/** Compute number of 30‑day months between two dates. */
export function calculateWorkspaceMonths(
  startDate: Date,
  endDate: Date
): number {
  return Math.ceil((differenceInDays(endDate, startDate) + 1) / 30);
}

/** A valid start date must be today or later. */
export function isValidWorkspaceStartDate(date: Date): boolean {
  return normalize(date) >= normalize(new Date());
}

/** ------------------ Range calculations ------------------ **/

/** Check if two date ranges overlap (inclusive). */
export function doDateRangesOverlap(
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date
): boolean {
  const s1 = normalize(start1),
    e1 = normalize(end1),
    s2 = normalize(start2),
    e2 = normalize(end2);
  return s1 <= e2 && s2 <= e1;
}

/** Check if a range overlaps with any existing slots. */
export function hasOverlappingBooking(
  startDate: Date,
  endDate: Date,
  existingSlots: Array<{
    notes?: string | null;
    expectedCompletionDate?: Date | null;
    durationMonths?: number | null;
  }>,
  excludeIndex?: number
): boolean {
  return existingSlots.some((slot, i) => {
    if (excludeIndex !== undefined && i === excludeIndex) return false;
    const { startDate: s, endDate: e } = parseWorkspaceDates(
      slot as Partial<ServiceItem>
    );
    return s && e ? doDateRangesOverlap(startDate, endDate, s, e) : false;
  });
}

/** Get all booked date ranges (excluding index if needed). */
export function getBookedDateRanges(
  slots: Array<{
    notes?: string | null;
    expectedCompletionDate?: Date | null;
    durationMonths?: number | null;
  }>,
  excludeIndex?: number
): Array<{ startDate: Date; endDate: Date }> {
  return slots
    .filter((_, i) => excludeIndex === undefined || i !== excludeIndex)
    .map((slot) => parseWorkspaceDates(slot as Partial<ServiceItem>))
    .filter(
      (d): d is { startDate: Date; endDate: Date } =>
        !!d.startDate && !!d.endDate
    );
}

/** ------------------ Notes builders & extractors ------------------ **/

/** Build workspace notes string with optional fields. */
export function buildWorkspaceNotes(
  startDate: Date,
  endDate: Date,
  options?: {
    timeSlot?: string;
    purpose?: string;
    additionalNotes?: string;
  }
): string {
  const parts = [
    `START_DATE:${startDate.toISOString()}`,
    `END_DATE:${endDate.toISOString()}`,
  ];
  if (options?.timeSlot) parts.push(`TIME_SLOT:${options.timeSlot}`);
  if (options?.purpose) parts.push(options.purpose);
  if (options?.additionalNotes) parts.push(options.additionalNotes);
  return parts.join("||");
}

export const getWorkspaceTimeSlot = (notes: string): string => {
  if (!notes) return "";
  const parts = notes.split("||");
  // TIME_SLOT is expected at index 2 when present
  if (parts[2]?.startsWith("TIME_SLOT:")) {
    return parts[2].slice("TIME_SLOT:".length) || "";
  }
  // Fallback to regex for older/invalid formats
  return notes.match(/TIME_SLOT:([^|]+)/)?.[1] || "";
};

export const getWorkspacePurpose = (notes: string): string => {
  if (!notes) return "";
  const parts = notes.split("||");
  // If TIME_SLOT present at index 2, purpose should be index 3
  if (parts[2]?.startsWith("TIME_SLOT:")) {
    return parts[3] || "";
  }
  // Otherwise purpose is index 2
  return parts[2] || "";
};

export const getWorkspaceAdditionalNotes = (notes: string): string => {
  if (!notes) return "";
  const parts = notes.split("||");
  let purposeIndex = 2;
  if (parts[2]?.startsWith("TIME_SLOT:")) purposeIndex = 3;
  // Additional notes are everything after purposeIndex
  return parts.slice(purposeIndex + 1).join("||") || "";
};

/**
 * Update workspace notes while preserving existing data.
 */
export function updateWorkspaceNotes(
  currentNotes: string,
  updates: {
    startDate?: Date;
    endDate?: Date;
    timeSlot?: string;
    purpose?: string;
    additionalNotes?: string;
  }
): string {
  const existing = parseWorkspaceDates({ notes: currentNotes });
  const startDate = updates.startDate || existing.startDate;
  const endDate = updates.endDate || existing.endDate;

  if (!startDate || !endDate) return currentNotes; // Incomplete

  return buildWorkspaceNotes(startDate, endDate, {
    timeSlot: updates.timeSlot ?? getWorkspaceTimeSlot(currentNotes),
    purpose: updates.purpose ?? getWorkspacePurpose(currentNotes),
    additionalNotes:
      updates.additionalNotes ?? getWorkspaceAdditionalNotes(currentNotes),
  });
}
