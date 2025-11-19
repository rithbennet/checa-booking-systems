/**
 * Workspace Booking Entity Types
 * Calendar event DTO for workspace schedule
 */

export interface WorkspaceEvent {
	id: string;
	userName: string;
	startDate: Date | string;
	endDate: Date | string;
	timeSlot: string | null;
	purpose: string | null;
}

/**
 * Workspace schedule range response
 */
export interface WorkspaceScheduleRange {
	events: WorkspaceEvent[];
	from: Date | string;
	to: Date | string;
}
