/**
 * Custom error class for validation errors that should return 400
 */
export class ValidationError extends Error {
	constructor(
		public error: string,
		public details?: Record<string, string[]>,
	) {
		super(error);
		this.name = "ValidationError";
	}
}
