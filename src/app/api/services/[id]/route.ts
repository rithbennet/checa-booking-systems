import { NextResponse } from "next/server";
import { getServiceById } from "@/entities/service/api/get-services";
import { badRequestResponse, withAuth } from "@/shared/server/api-middleware";

export const GET = withAuth(
  async (_request, _auth, context) => {
    const params = await context?.params;
    const id = params?.id;

    if (!id) {
      return badRequestResponse("Service ID is required");
    }

    const service = await getServiceById(id);

    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    return NextResponse.json(service);
  },
  {
    requireActive: true,
    rateLimit: {
      maxRequests: 100, // 100 requests
      windowMs: 60000, // per minute
    },
  }
);
