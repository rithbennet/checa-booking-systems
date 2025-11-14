export type UserType = "institutional" | "external" | null;
export type ApiUserType = "utm_member" | "external_member";

export interface AuthError {
	message: string;
	type?: string;
}

// Form types are now exported from schemas.ts
