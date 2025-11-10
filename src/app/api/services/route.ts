import { NextResponse } from "next/server";
import type { ServiceFilters, ServiceSortOption } from "@/entities/service";
import { getServices } from "@/entities/service/api/get-services";
import { withAuth } from "@/shared/server/api-middleware";

export const GET = withAuth(
  async (request) => {
    const { searchParams } = new URL(request.url);

    const filters: ServiceFilters = {};
    if (
      searchParams.get("category") &&
      searchParams.get("category") !== "all"
    ) {
      filters.category = searchParams.get(
        "category"
      ) as ServiceFilters["category"];
    }
    if (searchParams.get("search")) {
      filters.search = searchParams.get("search") ?? undefined;
    }
    if (searchParams.get("availability")) {
      filters.availability = searchParams.get(
        "availability"
      ) as ServiceFilters["availability"];
    }
    if (searchParams.get("userType")) {
      filters.userType = searchParams.get(
        "userType"
      ) as ServiceFilters["userType"];
    }
    if (searchParams.get("priceMin") && searchParams.get("priceMax")) {
      filters.priceRange = [
        Number.parseInt(searchParams.get("priceMin") ?? "0", 10),
        Number.parseInt(searchParams.get("priceMax") ?? "1000", 10),
      ];
    }

    const sort: ServiceSortOption | undefined = searchParams.get("sortField")
      ? {
          field: searchParams.get("sortField") as ServiceSortOption["field"],
          direction:
            (searchParams.get("sortDirection") as "asc" | "desc") || "asc",
        }
      : undefined;

    const limit = searchParams.get("limit")
      ? Number.parseInt(searchParams.get("limit") ?? "25", 10)
      : undefined;
    const offset = searchParams.get("offset")
      ? Number.parseInt(searchParams.get("offset") ?? "0", 10)
      : undefined;

    const services = await getServices({ filters, sort, limit, offset });

    return NextResponse.json(services);
  },
  {
    requireActive: true,
    rateLimit: {
      maxRequests: 100, // 100 requests
      windowMs: 60000, // per minute
    },
  }
);
