/**
 * User entity types
 *
 * This file contains type definitions for the User entity.
 * Entities represent core business concepts.
 */

export interface User {
	id: string;
	name: string;
	email: string;
	emailVerified: boolean;
	image?: string;
	createdAt: Date;
	updatedAt: Date;
}

export interface UserSession {
	user: User;
	expiresAt: Date;
}
