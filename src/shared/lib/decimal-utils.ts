/**
 * Decimal conversion utilities for Prisma Decimal types
 *
 * This module provides a centralized helper to convert Prisma Decimal objects
 * (or any numeric-like value) to plain JavaScript numbers.
 */

/**
 * Type guard to check if a value is a Prisma Decimal-like object
 * (an object with a toNumber method)
 */
function isPrismaDecimal(value: unknown): value is { toNumber: () => number } {
	return (
		typeof value === "object" &&
		value !== null &&
		"toNumber" in value &&
		typeof (value as { toNumber: unknown }).toNumber === "function"
	);
}

/**
 * Converts a Prisma Decimal object or other numeric value to a plain JavaScript number.
 *
 * @param value - The value to convert (can be Prisma Decimal, number, string, etc.)
 * @returns The numeric value as a JavaScript number
 *
 * @example
 * ```ts
 * // Prisma Decimal
 * const decimalAmount = addon.amount; // Prisma.Decimal
 * const num = toNumber(decimalAmount); // number
 *
 * // Already a number
 * const num2 = toNumber(100); // 100
 *
 * // String numeric
 * const num3 = toNumber("42.5"); // 42.5
 * ```
 */
export function toNumber(value: unknown): number {
	if (isPrismaDecimal(value)) {
		return value.toNumber();
	}
	return Number(value);
}
