/**
 * Service entity API - Get services
 */

import { db } from "@/shared/server/db";
import type {
  Service,
  ServiceFilters,
  ServicePricing,
  ServiceSortOption,
} from "../model/types";

export interface GetServicesParams {
  filters?: ServiceFilters;
  sort?: ServiceSortOption;
  limit?: number;
  offset?: number;
}

export async function getServices(
  params: GetServicesParams = {}
): Promise<Service[]> {
  const { filters, sort, limit = 25, offset = 0 } = params;

  const where: {
    category?: Service["category"];
    OR?: Array<{
      name?: { contains: string; mode: "insensitive" };
      description?: { contains: string; mode: "insensitive" };
      code?: { contains: string; mode: "insensitive" };
    }>;
  } = {};

  if (filters?.category && filters.category !== "all") {
    where.category = filters.category;
  }

  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { description: { contains: filters.search, mode: "insensitive" } },
      { code: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  const orderBy: Record<string, "asc" | "desc"> = {};
  if (sort) {
    orderBy[sort.field] = sort.direction;
  } else {
    orderBy.name = "asc";
  }

  const services = await db.service.findMany({
    where,
    orderBy,
    take: limit,
    skip: offset,
    include: {
      pricing: {
        where: {
          effectiveTo: null,
          // Filter pricing by userType if provided - only return user's pricing tier
          ...(filters?.userType ? { userType: filters.userType } : {}),
        },
      },
      addOnMappings: {
        where: {
          isEnabled: true,
          addOnCatalog: {
            isActive: true,
          },
        },
        include: {
          addOnCatalog: true,
        },
        orderBy: {
          addOnCatalog: {
            name: "asc",
          },
        },
      },
    },
  });

  return services.map((service) => ({
    // Only include fields that match the Service type
    id: service.id,
    code: service.code,
    name: service.name,
    description: service.description ?? undefined,
    category: service.category,
    isActive: service.isActive,
    requiresSample: service.requiresSample,
    minSampleMass: service.minSampleMass
      ? Number(service.minSampleMass)
      : undefined,
    operatingHours: service.operatingHours ?? undefined,
    createdAt: service.createdAt,
    updatedAt: service.updatedAt,
    pricing: service.pricing.map((p) => ({
      id: p.id,
      serviceId: p.serviceId,
      userType: p.userType as ServicePricing["userType"],
      price: Number(p.price),
      unit: p.unit,
      effectiveFrom: p.effectiveFrom,
      effectiveTo: p.effectiveTo ?? undefined,
    })),
    addOns: service.addOnMappings.map((mapping) => ({
      id: mapping.addOnId,
      mappingId: mapping.id,
      name: mapping.addOnCatalog.name,
      description: mapping.addOnCatalog.description,
      defaultAmount: Number(mapping.addOnCatalog.defaultAmount),
      customAmount: mapping.customAmount ? Number(mapping.customAmount) : null,
      effectiveAmount: Number(
        mapping.customAmount ?? mapping.addOnCatalog.defaultAmount
      ),
      applicableTo: mapping.addOnCatalog.applicableTo,
    })),
  }));
}

export async function getServiceById(id: string): Promise<Service | null> {
  const service = await db.service.findUnique({
    where: { id },
    include: {
      pricing: {
        where: {
          effectiveTo: null,
        },
      },
      addOnMappings: {
        where: {
          isEnabled: true,
          addOnCatalog: {
            isActive: true,
          },
        },
        include: {
          addOnCatalog: true,
        },
        orderBy: {
          addOnCatalog: {
            name: "asc",
          },
        },
      },
    },
  });

  if (!service) {
    return null;
  }

  return {
    // Only include fields that match the Service type
    id: service.id,
    code: service.code,
    name: service.name,
    description: service.description ?? undefined,
    category: service.category,
    isActive: service.isActive,
    requiresSample: service.requiresSample,
    minSampleMass: service.minSampleMass
      ? Number(service.minSampleMass)
      : undefined,
    operatingHours: service.operatingHours ?? undefined,
    createdAt: service.createdAt,
    updatedAt: service.updatedAt,
    pricing: service.pricing.map((p) => ({
      id: p.id,
      serviceId: p.serviceId,
      userType: p.userType as ServicePricing["userType"],
      price: Number(p.price),
      unit: p.unit,
      effectiveFrom: p.effectiveFrom,
      effectiveTo: p.effectiveTo ?? undefined,
    })),
    addOns: service.addOnMappings.map((mapping) => ({
      id: mapping.addOnId,
      mappingId: mapping.id,
      name: mapping.addOnCatalog.name,
      description: mapping.addOnCatalog.description,
      defaultAmount: Number(mapping.addOnCatalog.defaultAmount),
      customAmount: mapping.customAmount ? Number(mapping.customAmount) : null,
      effectiveAmount: Number(
        mapping.customAmount ?? mapping.addOnCatalog.defaultAmount
      ),
      applicableTo: mapping.addOnCatalog.applicableTo,
    })),
  };
}
