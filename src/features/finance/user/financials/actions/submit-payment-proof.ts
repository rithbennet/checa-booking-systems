"use server";

import type { payment_method_enum } from "generated/prisma";
import { revalidatePath } from "next/cache";
import { UTFile } from "uploadthing/server";
import { notifyAdminsPaymentUploaded } from "@/entities/notification/server/finance.notifications";
import { requireCurrentUserApi } from "@/shared/server/current-user";
import { db } from "@/shared/server/db";
import { utapi } from "@/shared/server/uploadthing";

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
	documentId?: string;
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

		// Upload file to blob storage using uploadthing
		const timestamp = Date.now();
		const utFile = new UTFile(
			[file],
			`payment-${serviceFormId}-${timestamp}-${file.name}`,
		);
		const uploadResult = await utapi.uploadFiles([utFile]);
		const uploaded = uploadResult[0];

		if (!uploaded?.data) {
			console.error("Upload failed:", uploaded?.error);
			return { success: false, error: "Failed to upload file" };
		}

		// Create fileBlob record
		const blob = await db.fileBlob.create({
			data: {
				key: uploaded.data.key,
				url: uploaded.data.ufsUrl,
				mimeType: file.type,
				fileName: file.name,
				sizeBytes: file.size,
				uploadedById: user.appUserId,
			},
		});

		// Store payment metadata as JSON in the note field
		const paymentMetadata = {
			paymentMethod,
			paymentDate: new Date(paymentDate).toISOString(),
			referenceNumber: referenceNumber || null,
			amount: parseFloat(amount),
			serviceFormId,
		};

		// Create bookingDocument record (replaces old payment record)
		const document = await db.bookingDocument.create({
			data: {
				bookingId: serviceForm.bookingRequest.id,
				blobId: blob.id,
				type: "payment_receipt",
				note: JSON.stringify(paymentMetadata),
				verificationStatus: "pending_verification",
				createdById: user.appUserId,
			},
		});

		// Send notifications to admins
		const admins = await db.user.findMany({
			where: { userType: "lab_administrator", status: "active" },
			select: { id: true },
		});

		if (admins.length > 0) {
			const adminIds = admins.map((a) => a.id);
			// Use notification service
			await notifyAdminsPaymentUploaded({
				adminIds,
				documentId: document.id,
				bookingReference: serviceForm.bookingRequest.referenceNumber,
				customerName: user.name || "Customer",
				amount,
				formNumber: serviceForm.formNumber,
			});
		}

		// Create audit log
		await db.auditLog.create({
			data: {
				userId: user.appUserId,
				action: "upload_payment_proof",
				entity: "BookingDocument",
				entityId: document.id,
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

		return { success: true, documentId: document.id };
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
