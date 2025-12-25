// Re-export commonly used email functions from notification entity
export { sendOrganizationDeletedEmail } from "@/entities/notification/server/email-sender";
export {
	getEmailRedirectTo,
	getFromEmail,
	getReplyToEmail,
	isEmailEnabled,
	resend,
	shouldRedirectEmails,
} from "./resend";
