/**
 * Invoice payer helpers
 */

import type {
  InvoicePayerDetails,
  InvoicePayerType,
  InvoiceProfile,
} from "../model/types";

export function campusLabel(utmCampus?: "kl" | "johor_bahru" | null): string {
  if (!utmCampus) return "";
  return utmCampus === "kl" ? "UTM KL" : "UTM JB";
}

interface BuildInvoiceAddressOptions {
  department?: string | null;
  faculty?: string | null;
  utmCampus?: "kl" | "johor_bahru" | null;
  organizationAddress?: string | null;
  isExternal?: boolean;
}

/**
 * Build a human-readable billing address string for invoices.
 */
export function buildInvoiceAddressDisplay(
  options: BuildInvoiceAddressOptions
): string {
  const { department, faculty, utmCampus, organizationAddress, isExternal } =
    options;
  if (isExternal) {
    return organizationAddress?.trim() || "";
  }

  const parts: string[] = [];
  if (department?.trim()) parts.push(department.trim());
  if (faculty?.trim()) parts.push(faculty.trim());
  const campus = campusLabel(utmCampus);
  if (campus) parts.push(campus);
  return parts.filter(Boolean).join(", ");
}

/**
 * Provide friendly labels for payer types.
 */
export function formatInvoicePayerType(type?: InvoicePayerType): string {
  switch (type) {
    case "external":
      return "External";
    case "staff":
      return "Staff";
    case "student-self":
      return "Student (Self)";
    case "student-supervisor":
      return "Student (Supervisor)";
    default:
      return "Not specified";
  }
}

/**
 * Build a snapshot of payer details suitable for review screens and invoices.
 */
export function deriveInvoicePayerDetails(
  profile: InvoiceProfile,
  type?: InvoicePayerType
): InvoicePayerDetails {
  const payerType = type ?? "external";
  const name =
    payerType === "student-supervisor"
      ? profile.supervisorName?.trim() || profile.fullName
      : profile.fullName;

  const address = buildInvoiceAddressDisplay({
    department: profile.department,
    faculty: profile.faculty,
    utmCampus: profile.utmCampus,
    organizationAddress: profile.organizationAddress,
    isExternal: payerType === "external",
  });

  return {
    type: payerType,
    name,
    address,
    campusLabel: campusLabel(profile.utmCampus),
    phone: profile.phone?.trim() || undefined,
    email: profile.email?.trim() || undefined,
    department: profile.department,
    faculty: profile.faculty,
    organizationName: profile.organizationName,
  };
}
