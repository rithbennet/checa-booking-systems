import { ZodError, type z } from "zod";
import { doAdminAction } from "@/entities/booking/review/server/actions";
import { AdminActionSchema } from "@/entities/booking/review/server/validations";
import {
	badRequest,
	createProtectedHandler,
	forbidden,
	serverError,
} from "@/shared/lib/api-factory";

export const POST = createProtectedHandler(
	async (
		request: Request,
		user,
		{ params }: { params?: Record<string, string> },
	) => {
		try {
			if (user.role !== "lab_administrator") return forbidden();

			// Validate params.id
			if (
				!params?.id ||
				typeof params.id !== "string" ||
				params.id.trim() === ""
			) {
				return badRequest("Invalid booking ID");
			}
			const id = params.id;

			const body = await request.json();

			// Validate request body with proper error handling
			let validated: z.infer<typeof AdminActionSchema>;
			try {
				validated = AdminActionSchema.parse(body);
			} catch (zodError) {
				if (zodError instanceof ZodError) {
					return badRequest("Invalid request");
				}
				throw zodError;
			}

			const result = await doAdminAction({
				bookingId: id,
				adminUserId: user.id,
				action: validated.action,
				comment: validated.comment,
			});

			return result;
		} catch (error) {
			console.error("[admin/bookings/[id]/action POST]", error);
			return serverError("Internal server error");
		}
	},
);
