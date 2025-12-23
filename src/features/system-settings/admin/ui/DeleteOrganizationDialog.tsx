"use client";

import { AlertTriangle, Loader2, Mail, Users } from "lucide-react";
import { useEffect, useState } from "react";
import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/shared/ui/shadcn/alert-dialog";
import { Button } from "@/shared/ui/shadcn/button";
import { Checkbox } from "@/shared/ui/shadcn/checkbox";
import { Label } from "@/shared/ui/shadcn/label";

interface AffectedUser {
	id: string;
	email: string;
	name: string | null;
}

interface DeleteOrganizationDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	organizationType: "faculty" | "department" | "ikohza" | "company" | "branch";
	organizationName: string;
	affectedUsers: AffectedUser[];
	isLoadingUsers: boolean;
	onConfirm: (sendEmails: boolean) => void;
	isDeleting: boolean;
}

const organizationLabels: Record<string, string> = {
	faculty: "Faculty",
	department: "Department",
	ikohza: "Ikohza",
	company: "Company",
	branch: "Branch",
};

export function DeleteOrganizationDialog({
	open,
	onOpenChange,
	organizationType,
	organizationName,
	affectedUsers,
	isLoadingUsers,
	onConfirm,
	isDeleting,
}: DeleteOrganizationDialogProps) {
	const [sendEmails, setSendEmails] = useState(true);
	const orgLabel = organizationLabels[organizationType] || organizationType;
	const hasAffectedUsers = affectedUsers.length > 0;

	// Reset sendEmails to default when dialog opens
	useEffect(() => {
		if (open) {
			setSendEmails(true);
		}
	}, [open]);

	return (
		<AlertDialog onOpenChange={onOpenChange} open={open}>
			<AlertDialogContent className="max-w-md">
				<AlertDialogHeader>
					<AlertDialogTitle className="flex items-center gap-2">
						<AlertTriangle className="h-5 w-5 text-destructive" />
						Delete {orgLabel}
					</AlertDialogTitle>
					<AlertDialogDescription className="space-y-3">
						<span>
							Are you sure you want to delete{" "}
							<strong className="text-foreground">{organizationName}</strong>?
							This action cannot be undone.
						</span>
					</AlertDialogDescription>
				</AlertDialogHeader>

				{isLoadingUsers ? (
					<div className="flex items-center justify-center py-4">
						<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
						<span className="ml-2 text-muted-foreground text-sm">
							Checking affected users...
						</span>
					</div>
				) : hasAffectedUsers ? (
					<div className="space-y-3">
						<div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
							<div className="flex items-start gap-2">
								<Users className="mt-0.5 h-4 w-4 text-yellow-600" />
								<div className="flex-1">
									<p className="font-medium text-sm text-yellow-800">
										{affectedUsers.length} user
										{affectedUsers.length === 1 ? "" : "s"} will be affected
									</p>
									<p className="mt-1 text-xs text-yellow-700">
										These users are currently associated with this{" "}
										{orgLabel.toLowerCase()}. Their affiliation will need to be
										updated.
									</p>
								</div>
							</div>
						</div>

						<div className="rounded-md border bg-muted/50 p-2">
							<p className="mb-2 font-medium text-muted-foreground text-xs">
								Affected users:
							</p>
							<ul className="space-y-1">
								{affectedUsers.slice(0, 5).map((user) => (
									<li className="text-xs" key={user.id}>
										{user.name || user.email}
										{user.name && (
											<span className="ml-1 text-muted-foreground">
												({user.email})
											</span>
										)}
									</li>
								))}
							</ul>
							{affectedUsers.length > 5 && (
								<p className="mt-2 text-muted-foreground text-xs">
									and {affectedUsers.length - 5} more user
									{affectedUsers.length - 5 === 1 ? "" : "s"}
								</p>
							)}
						</div>

						<div className="flex items-start gap-2">
							<Checkbox
								checked={sendEmails}
								id="send-emails"
								onCheckedChange={(checked) => setSendEmails(checked === true)}
							/>
							<div className="grid gap-1.5 leading-none">
								<Label
									className="flex cursor-pointer items-center gap-1.5 font-normal text-sm"
									htmlFor="send-emails"
								>
									<Mail className="h-3.5 w-3.5" />
									Notify affected users via email
								</Label>
								<p className="text-muted-foreground text-xs">
									Send an email to inform users they need to update their
									profile.
								</p>
							</div>
						</div>
					</div>
				) : null}

				<AlertDialogFooter>
					<AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
					<Button
						disabled={isDeleting || isLoadingUsers}
						onClick={() => onConfirm(sendEmails)}
						variant="destructive"
					>
						{isDeleting ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Deleting...
							</>
						) : (
							`Delete ${orgLabel}`
						)}
					</Button>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
