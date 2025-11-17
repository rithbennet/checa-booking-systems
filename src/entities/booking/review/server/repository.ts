import type { booking_status_enum, Prisma } from "generated/prisma";
import { db } from "@/shared/server/db";

export async function repoAdminList(params: {
  status?: string[];
  query?: string;
  page?: number;
  pageSize?: number;
  sortField?: string;
  sortDirection?: "asc" | "desc";
}) {
  const {
    status,
    query,
    page = 1,
    pageSize = 25,
    sortField = "updatedAt",
    sortDirection = "desc",
  } = params;

  const where: Prisma.BookingRequestWhereInput = {
    // Always exclude draft status for admin views
    status: status?.length
      ? { in: status as booking_status_enum[], not: "draft" }
      : { not: "draft" },
    ...(query
      ? {
          OR: [
            { referenceNumber: { contains: query, mode: "insensitive" } },
            { user: { firstName: { contains: query, mode: "insensitive" } } },
            { user: { lastName: { contains: query, mode: "insensitive" } } },
            { user: { email: { contains: query, mode: "insensitive" } } },
            {
              companyRelation: {
                name: { contains: query, mode: "insensitive" },
              },
            },
            {
              companyBranch: {
                name: { contains: query, mode: "insensitive" },
              },
            },
          ],
        }
      : {}),
  };

  // Map sort field to Prisma orderBy
  const orderBy: Prisma.BookingRequestOrderByWithRelationInput =
    sortField === "totalAmount"
      ? { totalAmount: sortDirection }
      : sortField === "createdAt"
      ? { createdAt: sortDirection }
      : { updatedAt: sortDirection };

  const [items, total] = await Promise.all([
    db.bookingRequest.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            userType: true,
            ikohza: { select: { name: true } },
            facultyRelation: { select: { name: true } },
            departmentRelation: { select: { name: true } },
          },
        },
        companyRelation: true,
        companyBranch: true,
        serviceItems: { include: { service: true } },
        workspaceBookings: true,
      },
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.bookingRequest.count({ where }),
  ]);

  return { items, total, page, pageSize };
}

export async function repoAdminDetail(id: string) {
  return db.bookingRequest.findUniqueOrThrow({
    where: { id },
    include: {
      user: true,
      companyRelation: true,
      companyBranch: true,
      serviceItems: {
        include: {
          service: true,
          serviceAddOns: true,
          equipmentUsages: { include: { equipment: true } },
          sampleTracking: true,
        },
      },
      workspaceBookings: {
        include: {
          equipmentUsages: { include: { equipment: true } },
          serviceAddOns: true,
        },
      },
    },
  });
}
