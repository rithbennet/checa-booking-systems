/**
 * Server-side helper to load payer profile details for invoice usage.
 */

import { db } from "@/shared/server/db";
import type { InvoiceProfile } from "../model/types";

export interface GetInvoicePayerProfileParams {
  userId?: string;
  email?: string;
}

export async function getInvoicePayerProfile(
  params: GetInvoicePayerProfileParams
): Promise<InvoiceProfile | null> {
  const { userId, email } = params;

  if (!userId && !email) {
    throw new Error("getInvoicePayerProfile requires a userId or email");
  }

  const user = await db.user.findUnique({
    where: userId ? { id: userId } : { email: email as string },
    select: {
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      academicType: true,
      supervisorName: true,
      // relational fields - use the relation names added to the schema
      departmentRelation: { select: { name: true } },
      facultyRelation: { select: { name: true } },
      companyRelation: { select: { name: true } },
      UTM: true,
      address: true,
    },
  });

  if (!user) {
    return null;
  }

  const fullName = `${user.firstName} ${user.lastName}`.trim();
  const utmCampus =
    user.UTM === "kuala_lumpur"
      ? "kl"
      : user.UTM === "johor_bahru"
      ? "johor_bahru"
      : null;

  return {
    fullName: fullName || "Unknown",
    email: user.email,
    phone: user.phone,
    academicType: user.academicType ?? null,
    supervisorName: user.supervisorName ?? null,
    department: user.departmentRelation?.name ?? null,
    faculty: user.facultyRelation?.name ?? null,
    utmCampus,
    organizationAddress: user.address ?? null,
    organizationName: user.companyRelation?.name ?? null,
  };
}
