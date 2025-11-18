export function canSeeAmount(userStatus: string | null | undefined) {
	return userStatus === "active";
}

export function canEdit(status: string) {
	return status === "draft";
}
