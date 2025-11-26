/**
 * Admin Service Repository
 *
 * Prisma queries for service administration
 */

import { db } from "@/shared/server/db";
import type { Prisma } from "../../../../generated/prisma";
import type {
	AdminServiceDetail,
	AdminServiceFilters,
	AdminServiceListItem,
	AdminServiceListResponse,
	ServiceCategory,
} from "../model/admin-types";

/**
 * Get paginated list of services for admin management
 */
export async function getAdminServices(
	filters: AdminServiceFilters = {},
): Promise<AdminServiceListResponse> {
	const { search, category, status, page = 1, perPage = 20 } = filters;

	// Build where clause
	const where: Prisma.ServiceWhereInput = {};

	// Status filter
	if (status === "active") {
		where.isActive = true;
	} else if (status === "inactive") {
		where.isActive = false;
	}

	// Category filter
	if (category && category !== "all") {
		where.category = category as ServiceCategory;
	}

	// Search filter
	if (search?.trim()) {
		where.OR = [
			{ code: { contains: search, mode: "insensitive" } },
			{ name: { contains: search, mode: "insensitive" } },
			{ description: { contains: search, mode: "insensitive" } },
		];
	}

	// Fetch data with pricing aggregation in a single query
	const [services, total] = await Promise.all([
		db.service.findMany({
			where,
			orderBy: { updatedAt: "desc" },
			skip: (page - 1) * perPage,
			take: perPage,
			include: {
				pricing: {
					where: {
						effectiveTo: null, // Only current pricing
					},
					select: {
						price: true,
					},
				},
			},
		}),
		db.service.count({ where }),
	]);

	// Map to AdminServiceListItem with price range calculation
	const items: AdminServiceListItem[] = services.map((service) => {
		const prices = service.pricing.map((p) => Number(p.price));
		const minPrice = prices.length > 0 ? Math.min(...prices) : null;
		const maxPrice = prices.length > 0 ? Math.max(...prices) : null;

		return {
			id: service.id,
			code: service.code,
			name: service.name,
			description: service.description,
			category: service.category,
			isActive: service.isActive,
			requiresSample: service.requiresSample,
			minSampleMass: service.minSampleMass
				? Number(service.minSampleMass)
				: null,
			operatingHours: service.operatingHours,
			minPrice,
			maxPrice,
			pricingCount: service.pricing.length,
			updatedAt: service.updatedAt.toISOString(),
		};
	});

	return {
		items,
		total,
		page,
		perPage,
	};
}

/**
 * Get detailed service information for editing
 */
export async function getAdminServiceDetail(
	id: string,
): Promise<AdminServiceDetail | null> {
	const service = await db.service.findUnique({
		where: { id },
		include: {
			pricing: {
				where: {
					effectiveTo: null, // Only current pricing
				},
				orderBy: { userType: "asc" },
			},
			addOnMappings: {
				include: {
					addOnCatalog: true,
				},
				orderBy: {
					addOnCatalog: { name: "asc" },
				},
			},
		},
	});

	if (!service) {
		return null;
	}

	return {
		id: service.id,
		code: service.code,
		name: service.name,
		description: service.description,
		category: service.category,
		isActive: service.isActive,
		requiresSample: service.requiresSample,
		minSampleMass: service.minSampleMass ? Number(service.minSampleMass) : null,
		operatingHours: service.operatingHours,
		createdAt: service.createdAt.toISOString(),
		updatedAt: service.updatedAt.toISOString(),
		pricing: service.pricing
			.filter((p) => p.userType !== "lab_administrator")
			.map((p) => ({
				userType: p.userType as
					| "mjiit_member"
					| "utm_member"
					| "external_member",
				price: Number(p.price),
				unit: p.unit,
			})),
		addOns: service.addOnMappings.map((mapping) => ({
			addOnId: mapping.addOnId,
			name: mapping.addOnCatalog.name,
			defaultAmount: Number(mapping.addOnCatalog.defaultAmount),
			isEnabled: mapping.isEnabled,
			customAmount: mapping.customAmount ? Number(mapping.customAmount) : null,
		})),
	};
}
