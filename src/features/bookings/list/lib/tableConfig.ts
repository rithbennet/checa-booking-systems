import type { SortKey } from "../model/filters.schema";

export const SORT_OPTIONS: Array<{ label: string; value: SortKey }> = [
  { label: "Updated (newest)", value: "updated_at:desc" },
  { label: "Updated (oldest)", value: "updated_at:asc" },
  { label: "Created (newest)", value: "created_at:desc" },
  { label: "Created (oldest)", value: "created_at:asc" },
  { label: "Status (A→Z)", value: "status:asc" },
  { label: "Amount (high→low)", value: "amount:desc" },
  { label: "Amount (low→high)", value: "amount:asc" },
];
