/**
 * User Profile Repository
 * Data access layer for user profile operations
 */

import { db } from "@/shared/server/db";
import { ValidationError } from "@/shared/server/errors";
import type { UpdateProfileInput } from "../model/schemas";
import { updateProfileInputSchema } from "../model/schemas";
import type { UserSummaryVM } from "../model/types";

// ==============================================================
// Types
// ==============================================================

export interface UserProfileVM {
	id: string;
	firstName: string;
	lastName: string;
	email: string;
	phone: string | null;
	profileImageUrl: string | null; // UploadThing URL
	userType: string;
	academicType: string;
	userIdentifier: string | null;
	supervisorName: string | null;
	status: string;
	organization: {
		faculty?: string | null;
		department?: string | null;
		ikohza?: string | null;
		company?: string | null;
		branch?: string | null;
		facultyId?: string | null;
		departmentId?: string | null;
		ikohzaId?: string | null;
		companyId?: string | null;
		companyBranchId?: string | null;
		isMjiit?: boolean;
	};
	createdAt: string;
	lastLoginAt: string | null;
}

// UpdateProfileInput type is exported from ../model/schemas

// ==============================================================
// Helper Functions
// ==============================================================

/**
 * Determine if a faculty is MJIIT based on its code
 */
function isMjiitFaculty(code: string | null | undefined): boolean {
	return code?.toUpperCase() === "MJIIT";
}

// ==============================================================
// Query Functions
// ==============================================================

/**
 * Get user profile by user ID
 */
export async function getUserProfile(
	userId: string,
): Promise<UserProfileVM | null> {
	const user = await db.user.findUnique({
		where: { id: userId },
		include: {
			faculty: { select: { id: true, code: true, name: true } },
			department: { select: { id: true, name: true } },
			ikohza: { select: { id: true, name: true } },
			company: { select: { id: true, name: true } },
			companyBranch: { select: { id: true, name: true } },
		},
	});

	if (!user) return null;

	return {
		id: user.id,
		firstName: user.firstName,
		lastName: user.lastName,
		email: user.email,
		phone: user.phone,
		profileImageUrl: user.profileImageUrl,
		userType: user.userType,
		academicType: user.academicType,
		userIdentifier: user.userIdentifier,
		supervisorName: user.supervisorName,
		status: user.status,
		organization: {
			faculty: user.faculty?.name ?? null,
			department: user.department?.name ?? null,
			ikohza: user.ikohza?.name ?? null,
			company: user.company?.name ?? null,
			branch: user.companyBranch?.name ?? null,
			facultyId: user.faculty?.id ?? null,
			departmentId: user.department?.id ?? null,
			ikohzaId: user.ikohza?.id ?? null,
			companyId: user.company?.id ?? null,
			companyBranchId: user.companyBranch?.id ?? null,
			isMjiit: isMjiitFaculty(user.faculty?.code),
		},
		createdAt: user.createdAt.toISOString(),
		lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
	};
}

/**
 * Update user profile
 */
export async function updateUserProfile(
	userId: string,
	input: UpdateProfileInput,
): Promise<UserProfileVM | null> {
	// Validate input using zod schema
	const validationResult = updateProfileInputSchema.safeParse(input);
	if (!validationResult.success) {
		const fieldErrors = validationResult.error.flatten().fieldErrors;
		const errorMessage =
			validationResult.error.errors[0]?.message || "Validation failed";
		throw new ValidationError(errorMessage, fieldErrors);
	}

	const validatedInput = validationResult.data;

	const user = await db.user.update({
		where: { id: userId },
		data: {
			...(validatedInput.firstName !== undefined && {
				firstName: validatedInput.firstName,
			}),
			...(validatedInput.lastName !== undefined && {
				lastName: validatedInput.lastName,
			}),
			...(validatedInput.phone !== undefined && {
				phone: validatedInput.phone,
			}),
			...(validatedInput.userIdentifier !== undefined && {
				userIdentifier: validatedInput.userIdentifier,
			}),
			...(validatedInput.supervisorName !== undefined && {
				supervisorName: validatedInput.supervisorName,
			}),
			...(validatedInput.facultyId !== undefined && {
				facultyId: validatedInput.facultyId,
			}),
			...(validatedInput.departmentId !== undefined && {
				departmentId: validatedInput.departmentId,
			}),
			...(validatedInput.ikohzaId !== undefined && {
				ikohzaId: validatedInput.ikohzaId,
			}),
			...(validatedInput.companyId !== undefined && {
				companyId: validatedInput.companyId,
			}),
			...(validatedInput.companyBranchId !== undefined && {
				companyBranchId: validatedInput.companyBranchId,
			}),
			updatedAt: new Date(),
		},
		include: {
			faculty: { select: { id: true, code: true, name: true } },
			department: { select: { id: true, name: true } },
			ikohza: { select: { id: true, name: true } },
			company: { select: { id: true, name: true } },
			companyBranch: { select: { id: true, name: true } },
		},
	});

	return {
		id: user.id,
		firstName: user.firstName,
		lastName: user.lastName,
		email: user.email,
		phone: user.phone,
		profileImageUrl: user.profileImageUrl,
		userType: user.userType,
		academicType: user.academicType,
		userIdentifier: user.userIdentifier,
		supervisorName: user.supervisorName,
		status: user.status,
		organization: {
			faculty: user.faculty?.name ?? null,
			department: user.department?.name ?? null,
			ikohza: user.ikohza?.name ?? null,
			company: user.company?.name ?? null,
			branch: user.companyBranch?.name ?? null,
			facultyId: user.faculty?.id ?? null,
			departmentId: user.department?.id ?? null,
			ikohzaId: user.ikohza?.id ?? null,
			companyId: user.company?.id ?? null,
			companyBranchId: user.companyBranch?.id ?? null,
			isMjiit: isMjiitFaculty(user.faculty?.code),
		},
		createdAt: user.createdAt.toISOString(),
		lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
	};
}

/**
 * Update user profile image
 * @param userId - User ID
 * @param imageUrl - UploadThing URL, or null to remove
 * @returns Updated profile image URL, or null if user not found
 */
export async function updateUserProfileImage(
	userId: string,
	imageUrl: string | null,
): Promise<{ profileImageUrl: string | null } | null> {
	// Check if user exists first
	const existingUser = await db.user.findUnique({
		where: { id: userId },
		select: { id: true },
	});

	if (!existingUser) {
		return null;
	}

	const user = await db.user.update({
		where: { id: userId },
		data: {
			profileImageUrl: imageUrl,
			updatedAt: new Date(),
		},
		select: {
			profileImageUrl: true,
		},
	});

	return {
		profileImageUrl: user.profileImageUrl,
	};
}

// ==============================================================
// User Summary Data (for Admin)
// ==============================================================

/**
 * Get comprehensive user summary data for admin view
 */
export async function getUserSummary(
	userId: string,
): Promise<UserSummaryVM | null> {
	// Check if user exists (must be sequential - needed for userId and createdAt)
	const user = await db.user.findUnique({
		where: { id: userId },
		select: { id: true, createdAt: true },
	});

	if (!user) return null;

	// Run all independent queries in parallel
	const [
		bookingCounts,
		recentBookings,
		serviceUsage,
		sampleEquipmentUsage,
		workspaceEquipmentUsage,
		documents,
	] = await Promise.all([
		// Get booking counts
		db.bookingRequest.groupBy({
			by: ["status"],
			where: { userId },
			_count: { _all: true },
		}),
		// Get recent bookings (last 10)
		db.bookingRequest.findMany({
			where: { userId },
			orderBy: { createdAt: "desc" },
			take: 10,
			select: {
				id: true,
				referenceNumber: true,
				status: true,
				totalAmount: true,
				createdAt: true,
			},
		}),
		// Get usage patterns - top services
		db.bookingServiceItem.groupBy({
			by: ["serviceId"],
			where: {
				bookingRequest: { userId },
			},
			_count: { _all: true },
		}),
		// Get top equipment - sample equipment usage
		db.sampleEquipmentUsage.groupBy({
			by: ["equipmentId"],
			where: {
				bookedItem: {
					bookingRequest: { userId },
				},
			},
			_count: { _all: true },
		}),
		// Get top equipment - workspace equipment usage
		db.workspaceEquipmentUsage.groupBy({
			by: ["equipmentId"],
			where: {
				workspaceBooking: {
					bookingRequest: { userId },
				},
			},
			_count: { _all: true },
		}),
		// Get document status
		db.bookingDocument.findMany({
			where: {
				booking: { userId },
			},
			select: {
				verificationStatus: true,
			},
		}),
	]);

	// Process booking counts
	const statusCounts: Record<string, number> = {};
	for (const item of bookingCounts) {
		statusCounts[item.status] = item._count._all;
	}

	const totalBookings = Object.values(statusCounts).reduce((a, b) => a + b, 0);
	const upcoming =
		(statusCounts.approved || 0) + (statusCounts.in_progress || 0);
	const completed = statusCounts.completed || 0;
	const cancelled = statusCounts.cancelled || 0;
	const rejected = statusCounts.rejected || 0;

	// Process financial data - now based on document verification
	const totalSpent = 0; // TODO: Calculate from verified bookings
	const outstanding = 0; // TODO: Calculate from unverified bookings
	const pending = 0; // TODO: Calculate from pending verification
	const lastPaymentDate: Date | null = null;
	const lastPaymentAmount: number | null = null;

	// Process service usage - sort by count descending and take top 3
	const sortedServiceUsage = serviceUsage
		.sort((a, b) => (b._count?._all || 0) - (a._count?._all || 0))
		.slice(0, 3);

	const serviceIds = sortedServiceUsage.map((s) => s.serviceId);
	// Get services lookup (depends on serviceUsage results)
	const services = await db.service.findMany({
		where: { id: { in: serviceIds } },
		select: { id: true, name: true },
	});

	const topServices = sortedServiceUsage.map((usage) => {
		const service = services.find((s) => s.id === usage.serviceId);
		return {
			name: service?.name || "Unknown",
			count: usage._count?._all || 0,
		};
	});

	// Combine and aggregate equipment counts by equipmentId
	const equipmentCounts = new Map<string, number>();
	for (const usage of sampleEquipmentUsage) {
		const current = equipmentCounts.get(usage.equipmentId) || 0;
		equipmentCounts.set(usage.equipmentId, current + (usage._count?._all || 0));
	}
	for (const usage of workspaceEquipmentUsage) {
		const current = equipmentCounts.get(usage.equipmentId) || 0;
		equipmentCounts.set(usage.equipmentId, current + (usage._count?._all || 0));
	}

	// Sort by count and take top 3
	const topEquipmentIds = Array.from(equipmentCounts.entries())
		.sort((a, b) => b[1] - a[1])
		.slice(0, 3)
		.map(([id]) => id);

	// Get equipment lookup (depends on equipment usage results)
	const equipment = await db.labEquipment.findMany({
		where: { id: { in: topEquipmentIds } },
		select: { id: true, name: true },
	});

	const topEquipment = topEquipmentIds.map((equipmentId) => {
		const eq = equipment.find((e) => e.id === equipmentId);
		return {
			name: eq?.name || "Unknown",
			count: equipmentCounts.get(equipmentId) || 0,
		};
	});

	// Calculate average booking frequency (bookings per month)
	const monthsSinceRegistration =
		(Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24 * 30);
	const minimumThreshold = 1; // minimum 1 month for reliable frequency calculation
	const averageBookingFrequency =
		monthsSinceRegistration >= minimumThreshold
			? totalBookings / monthsSinceRegistration
			: null; // Return null for insufficient data

	const documentStatus = {
		totalDocuments: documents.length,
		verified: documents.filter((d) => d.verificationStatus === "verified")
			.length,
		pending: documents.filter(
			(d) => d.verificationStatus === "pending_verification",
		).length,
		rejected: documents.filter((d) => d.verificationStatus === "rejected")
			.length,
	};

	return {
		bookingOverview: {
			total: totalBookings,
			upcoming,
			completed,
			cancelled,
			rejected,
		},
		recentBookings: recentBookings.map((b) => ({
			id: b.id,
			referenceNumber: b.referenceNumber,
			status: b.status,
			totalAmount: Number(b.totalAmount),
			createdAt: b.createdAt.toISOString(),
		})),
		financialSummary: {
			totalSpent,
			outstanding,
			pending,
			lastPaymentDate: lastPaymentDate?.toISOString() || null,
			lastPaymentAmount,
		},
		usagePatterns: {
			topServices,
			topEquipment,
			averageBookingFrequency:
				averageBookingFrequency !== null
					? Math.round(averageBookingFrequency * 10) / 10
					: null,
		},
		documentStatus,
	};
}
