"use server";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { payment_method_enum } from "generated/prisma";
import { revalidatePath } from "next/cache";
import { requireCurrentUserApi } from "@/shared/server/current-user";
import { db } from "@/shared/server/db";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = [
	"image/jpeg",
	"image/png",
	"image/gif",
	"image/webp",
	"application/pdf",
];

interface SubmitPaymentProofResult {
	success: boolean;
	error?: string;
	paymentId?: string;
}

export async function submitPaymentProof(
	formData: FormData,
): Promise<SubmitPaymentProofResult> {
	try {
		// Authenticate user
		const user = await requireCurrentUserApi();

		// Extract form data
		const serviceFormId = formData.get("serviceFormId") as string;
		const paymentMethod = formData.get("paymentMethod") as payment_method_enum;
		const paymentDate = formData.get("paymentDate") as string;
		const referenceNumber = formData.get("referenceNumber") as string | null;
		const amount = formData.get("amount") as string;
		const file = formData.get("file") as File | null;

		// Validate required fields
		if (!serviceFormId || !paymentMethod || !paymentDate || !amount) {
			return { success: false, error: "Missing required fields" };
		}

		if (!file) {
			return { success: false, error: "Payment receipt file is required" };
		}

		// Validate file size
		if (file.size > MAX_FILE_SIZE) {
			return { success: false, error: "File size must be less than 5MB" };
		}

		// Validate file type
		if (!ALLOWED_TYPES.includes(file.type)) {
			return {
				success: false,
				error: "Invalid file type. Please upload an image or PDF",
			};
		}

		// Verify service form exists and belongs to user
		const serviceForm = await db.serviceForm.findFirst({
			where: {
				id: serviceFormId,
				bookingRequest: {
					userId: user.appUserId,
				},
			},
			include: {
				bookingRequest: {
					select: { id: true, referenceNumber: true },
				},
			},
		});

		if (!serviceForm) {
			return { success: false, error: "Service form not found" };
		}

		// Generate unique filename
		const timestamp = Date.now();
		const ext = path.extname(file.name) || getExtensionFromType(file.type);
		const filename = `payment-${serviceFormId}-${timestamp}${ext}`;

		// Create upload directory if it doesn't exist
		const uploadDir = path.join(
			process.cwd(),
			"public",
			"uploads",
			"payment-proofs",
		);
		await mkdir(uploadDir, { recursive: true });

		// Save file to disk
		const filePath = path.join(uploadDir, filename);
		const bytes = await file.arrayBuffer();
		const buffer = Buffer.from(bytes);
		await writeFile(filePath, buffer);

		// Store public path in database
		const publicPath = `/uploads/payment-proofs/${filename}`;

		// Create payment record
		const payment = await db.payment.create({
			data: {
				serviceFormId,
				bookingId: serviceForm.bookingRequest.id,
				amount: parseFloat(amount),
				paymentMethod,
				paymentDate: new Date(paymentDate),
				referenceNumber: referenceNumber || null,
				receiptFilePath: publicPath,
				status: "pending_verification",
				uploadedBy: user.appUserId,
				uploadedAt: new Date(),
			},
		});

		// Create notification for admins
		const admins = await db.user.findMany({
			where: { userType: "lab_administrator", status: "active" },
			select: { id: true },
		});

		if (admins.length > 0) {
			await db.notification.createMany({
				data: admins.map((admin) => ({
					userId: admin.id,
					type: "payment_reminder" as const,
					relatedEntityType: "payment",
					relatedEntityId: payment.id,
					title: "New Payment Receipt Uploaded",
					message: `A payment receipt has been uploaded for Form ${serviceForm.formNumber} (Booking: ${serviceForm.bookingRequest.referenceNumber}). Please verify.`,
					emailSent: false,
				})),
			});
		}

		// Create audit log
		await db.auditLog.create({
			data: {
				userId: user.appUserId,
				action: "upload_payment_proof",
				entity: "Payment",
				entityId: payment.id,
				metadata: {
					serviceFormId,
					formNumber: serviceForm.formNumber,
					bookingRef: serviceForm.bookingRequest.referenceNumber,
					amount,
					paymentMethod,
				},
			},
		});

		// Revalidate the financials page
		revalidatePath("/financials");

		return { success: true, paymentId: payment.id };
	} catch (error) {
		console.error("Error submitting payment proof:", error);

		if (error instanceof Error && error.message === "Unauthorized") {
			return { success: false, error: "Please sign in to continue" };
		}

		return {
			success: false,
			error: "Failed to submit payment. Please try again.",
		};
	}
}

function getExtensionFromType(mimeType: string): string {
	const typeMap: Record<string, string> = {
		"image/jpeg": ".jpg",
		"image/png": ".png",
		"image/gif": ".gif",
		"image/webp": ".webp",
		"application/pdf": ".pdf",
	};
	return typeMap[mimeType] || ".bin";
}
