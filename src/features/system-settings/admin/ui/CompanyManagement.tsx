"use client";

import { Building, MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
	useAffectedUsersByBranch,
	useAffectedUsersByCompany,
	useCompanies,
	useDeleteBranch,
	useDeleteCompany,
} from "@/entities/organization/api";
import type { CompanyBranch } from "@/entities/organization/model/types";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/shared/ui/shadcn/accordion";
import { Button } from "@/shared/ui/shadcn/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/shared/ui/shadcn/card";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/shared/ui/shadcn/dialog";
import { DeleteOrganizationDialog } from "./DeleteOrganizationDialog";
import { CreateBranchForm } from "./forms/CreateBranchForm";
import { CreateCompanyForm } from "./forms/CreateCompanyForm";
import { EditBranchForm } from "./forms/EditBranchForm";
import { EditCompanyForm } from "./forms/EditCompanyForm";

interface DeleteState {
	type: "company" | "branch";
	id: string;
	name: string;
}

export function CompanyManagement() {
	const { data: companies, isLoading } = useCompanies();
	const [isCreateCompanyOpen, setIsCreateCompanyOpen] = useState(false);
	const [editingCompany, setEditingCompany] = useState<{
		id: string;
		name: string;
		legalName: string | null;
		regNo: string | null;
	} | null>(null);
	const [editingBranch, setEditingBranch] = useState<CompanyBranch | null>(
		null,
	);
	const [deleteState, setDeleteState] = useState<DeleteState | null>(null);

	const { mutate: deleteCompany, isPending: isDeletingCompany } =
		useDeleteCompany();
	const { mutate: deleteBranch, isPending: isDeletingBranch } =
		useDeleteBranch();

	const { data: affectedCompanyUsers, isLoading: isLoadingCompanyUsers } =
		useAffectedUsersByCompany(
			deleteState?.type === "company" ? deleteState.id : "",
		);
	const { data: affectedBranchUsers, isLoading: isLoadingBranchUsers } =
		useAffectedUsersByBranch(
			deleteState?.type === "branch" ? deleteState.id : "",
		);

	const handleDelete = (sendEmails: boolean) => {
		if (!deleteState) return;

		const onSuccess = () => {
			toast.success(
				`${deleteState.type.charAt(0).toUpperCase() + deleteState.type.slice(1)} deleted successfully`,
			);
			setDeleteState(null);
		};
		const onError = (error: unknown) => {
			toast.error(error instanceof Error ? error.message : "An error occurred");
		};

		if (deleteState.type === "company") {
			deleteCompany({ id: deleteState.id, sendEmails }, { onSuccess, onError });
		} else if (deleteState.type === "branch") {
			deleteBranch({ id: deleteState.id, sendEmails }, { onSuccess, onError });
		}
	};

	const getAffectedUsers = () => {
		if (deleteState?.type === "company")
			return affectedCompanyUsers?.users ?? [];
		if (deleteState?.type === "branch") return affectedBranchUsers?.users ?? [];
		return [];
	};

	const isLoadingAffectedUsers = () => {
		if (deleteState?.type === "company") return isLoadingCompanyUsers;
		if (deleteState?.type === "branch") return isLoadingBranchUsers;
		return false;
	};

	const isDeleting = isDeletingCompany || isDeletingBranch;

	if (isLoading) {
		return (
			<output aria-busy="true" aria-live="polite">
				Loading organizations...
			</output>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h3 className="font-medium text-lg">External Organizations</h3>
					<p className="text-muted-foreground text-sm">
						Manage companies and their branches.
					</p>
				</div>
				<Dialog
					onOpenChange={setIsCreateCompanyOpen}
					open={isCreateCompanyOpen}
				>
					<DialogTrigger asChild>
						<Button>
							<Plus className="mr-2 h-4 w-4" />
							Add Company
						</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Add New Company</DialogTitle>
						</DialogHeader>
						<CreateCompanyForm
							onSuccess={() => setIsCreateCompanyOpen(false)}
						/>
					</DialogContent>
				</Dialog>
			</div>

			<div className="grid gap-4">
				{companies?.map((company) => (
					<Card key={company.id}>
						<CardHeader className="pb-3">
							<CardTitle className="flex items-center justify-between text-base">
								<div className="flex items-center gap-2">
									<Building className="h-4 w-4 text-muted-foreground" />
									<span>{company.name}</span>
									{company.regNo && (
										<span className="ml-2 font-normal text-muted-foreground text-xs">
											(Reg: {company.regNo})
										</span>
									)}
								</div>
								<div className="flex items-center gap-1">
									<Dialog
										onOpenChange={(open) => !open && setEditingCompany(null)}
										open={editingCompany?.id === company.id}
									>
										<DialogTrigger asChild>
											<Button
												onClick={() => setEditingCompany(company)}
												size="icon"
												variant="ghost"
											>
												<Pencil className="h-4 w-4" />
											</Button>
										</DialogTrigger>
										<DialogContent>
											<DialogHeader>
												<DialogTitle>Edit Company</DialogTitle>
											</DialogHeader>
											<EditCompanyForm
												company={company}
												onSuccess={() => setEditingCompany(null)}
											/>
										</DialogContent>
									</Dialog>
									<Button
										onClick={() =>
											setDeleteState({
												type: "company",
												id: company.id,
												name: company.name,
											})
										}
										size="icon"
										variant="ghost"
									>
										<Trash2 className="h-4 w-4 text-destructive" />
									</Button>
								</div>
							</CardTitle>
						</CardHeader>
						<CardContent>
							<Accordion className="w-full" type="multiple">
								<AccordionItem value="branches">
									<AccordionTrigger className="py-2 text-sm hover:no-underline">
										<div className="flex items-center gap-2">
											<MapPin className="h-4 w-4" />
											<span>Branches ({company.branches.length})</span>
										</div>
									</AccordionTrigger>
									<AccordionContent>
										<div className="space-y-4 pt-2">
											<div className="grid gap-2">
												{company.branches.map((branch) => (
													<div
														className="flex items-center justify-between rounded-md border p-2 text-sm"
														key={branch.id}
													>
														<div>
															<span className="font-medium">{branch.name}</span>
															{branch.city && branch.state && (
																<span className="ml-2 text-muted-foreground">
																	- {branch.city}, {branch.state}
																</span>
															)}
														</div>
														<div className="flex items-center gap-1">
															<Dialog
																onOpenChange={(open) =>
																	!open && setEditingBranch(null)
																}
																open={editingBranch?.id === branch.id}
															>
																<DialogTrigger asChild>
																	<Button
																		onClick={() => setEditingBranch(branch)}
																		size="icon"
																		variant="ghost"
																	>
																		<Pencil className="h-3 w-3" />
																	</Button>
																</DialogTrigger>
																<DialogContent>
																	<DialogHeader>
																		<DialogTitle>Edit Branch</DialogTitle>
																	</DialogHeader>
																	<EditBranchForm
																		branch={branch}
																		onSuccess={() => setEditingBranch(null)}
																	/>
																</DialogContent>
															</Dialog>
															<Button
																onClick={() =>
																	setDeleteState({
																		type: "branch",
																		id: branch.id,
																		name: branch.name,
																	})
																}
																size="icon"
																variant="ghost"
															>
																<Trash2 className="h-3 w-3 text-destructive" />
															</Button>
														</div>
													</div>
												))}
												{company.branches.length === 0 && (
													<p className="text-muted-foreground text-sm italic">
														No branches added yet.
													</p>
												)}
											</div>
											<Dialog>
												<DialogTrigger asChild>
													<Button
														className="w-full"
														size="sm"
														variant="outline"
													>
														<Plus className="mr-2 h-3 w-3" />
														Add Branch
													</Button>
												</DialogTrigger>
												<DialogContent>
													<DialogHeader>
														<DialogTitle>
															Add Branch to {company.name}
														</DialogTitle>
													</DialogHeader>
													<CreateBranchForm
														companyId={company.id}
														onSuccess={() => {
															// Dialog closes automatically
														}}
													/>
												</DialogContent>
											</Dialog>
										</div>
									</AccordionContent>
								</AccordionItem>
							</Accordion>
						</CardContent>
					</Card>
				))}
				{companies?.length === 0 && (
					<div className="py-8 text-center text-muted-foreground">
						No companies found. Add one to get started.
					</div>
				)}
			</div>

			<DeleteOrganizationDialog
				affectedUsers={getAffectedUsers()}
				isDeleting={isDeleting}
				isLoadingUsers={isLoadingAffectedUsers()}
				onConfirm={handleDelete}
				onOpenChange={(open) => !open && setDeleteState(null)}
				open={deleteState !== null}
				organizationName={deleteState?.name ?? ""}
				organizationType={deleteState?.type ?? "company"}
			/>
		</div>
	);
}
