"use client";

import {
	Building2,
	GraduationCap,
	Pencil,
	Plus,
	Trash2,
	Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
	useAffectedUsersByDepartment,
	useAffectedUsersByFaculty,
	useAffectedUsersByIkohza,
	useDeleteDepartment,
	useDeleteFaculty,
	useDeleteIkohza,
	useFaculties,
} from "@/entities/organization/api";
import type { Department, Ikohza } from "@/entities/organization/model/types";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/shared/ui/shadcn/accordion";
import { Badge } from "@/shared/ui/shadcn/badge";
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
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/shared/ui/shadcn/tooltip";
import { DeleteOrganizationDialog } from "./DeleteOrganizationDialog";
import { CreateDepartmentForm } from "./forms/CreateDepartmentForm";
import { CreateFacultyForm } from "./forms/CreateFacultyForm";
import { CreateIkohzaForm } from "./forms/CreateIkohzaForm";
import { EditDepartmentForm } from "./forms/EditDepartmentForm";
import { EditFacultyForm } from "./forms/EditFacultyForm";
import { EditIkohzaForm } from "./forms/EditIkohzaForm";

const MJIIT_FACULTY_CODE = "MJIIT";

interface DeleteState {
	type: "faculty" | "department" | "ikohza";
	id: string;
	name: string;
}

export function FacultyManagement() {
	const { data: faculties, isLoading } = useFaculties();
	const [isCreateFacultyOpen, setIsCreateFacultyOpen] = useState(false);
	const [editingFaculty, setEditingFaculty] = useState<{
		id: string;
		code: string;
		name: string;
	} | null>(null);
	const [editingDepartment, setEditingDepartment] = useState<Department | null>(
		null,
	);
	const [editingIkohza, setEditingIkohza] = useState<Ikohza | null>(null);
	const [deleteState, setDeleteState] = useState<DeleteState | null>(null);
	const [creatingDeptForFacultyId, setCreatingDeptForFacultyId] = useState<
		string | null
	>(null);
	const [creatingIkohzaForFacultyId, setCreatingIkohzaForFacultyId] = useState<
		string | null
	>(null);

	const { mutate: deleteFaculty, isPending: isDeletingFaculty } =
		useDeleteFaculty();
	const { mutate: deleteDepartment, isPending: isDeletingDepartment } =
		useDeleteDepartment();
	const { mutate: deleteIkohza, isPending: isDeletingIkohza } =
		useDeleteIkohza();

	const { data: affectedFacultyUsers, isLoading: isLoadingFacultyUsers } =
		useAffectedUsersByFaculty(
			deleteState?.type === "faculty" ? deleteState.id : "",
		);
	const { data: affectedDepartmentUsers, isLoading: isLoadingDepartmentUsers } =
		useAffectedUsersByDepartment(
			deleteState?.type === "department" ? deleteState.id : "",
		);
	const { data: affectedIkohzaUsers, isLoading: isLoadingIkohzaUsers } =
		useAffectedUsersByIkohza(
			deleteState?.type === "ikohza" ? deleteState.id : "",
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

		if (deleteState.type === "faculty") {
			deleteFaculty({ id: deleteState.id, sendEmails }, { onSuccess, onError });
		} else if (deleteState.type === "department") {
			deleteDepartment(
				{ id: deleteState.id, sendEmails },
				{ onSuccess, onError },
			);
		} else if (deleteState.type === "ikohza") {
			deleteIkohza({ id: deleteState.id, sendEmails }, { onSuccess, onError });
		}
	};

	const getAffectedUsers = () => {
		if (deleteState?.type === "faculty")
			return affectedFacultyUsers?.users ?? [];
		if (deleteState?.type === "department")
			return affectedDepartmentUsers?.users ?? [];
		if (deleteState?.type === "ikohza") return affectedIkohzaUsers?.users ?? [];
		return [];
	};

	const isLoadingAffectedUsers = () => {
		if (deleteState?.type === "faculty") return isLoadingFacultyUsers;
		if (deleteState?.type === "department") return isLoadingDepartmentUsers;
		if (deleteState?.type === "ikohza") return isLoadingIkohzaUsers;
		return false;
	};

	const isDeleting =
		isDeletingFaculty || isDeletingDepartment || isDeletingIkohza;

	if (isLoading) {
		return <div>Loading academic structure...</div>;
	}

	return (
		<TooltipProvider>
			<div className="space-y-6">
				<div className="flex items-center justify-between">
					<div>
						<h3 className="font-medium text-lg">Academic Structure</h3>
						<p className="text-muted-foreground text-sm">
							Manage faculties, departments, and ikohzas.
						</p>
					</div>
					<Dialog
						onOpenChange={setIsCreateFacultyOpen}
						open={isCreateFacultyOpen}
					>
						<DialogTrigger asChild>
							<Button>
								<Plus className="mr-2 h-4 w-4" />
								Add Faculty
							</Button>
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>Add New Faculty</DialogTitle>
							</DialogHeader>
							<CreateFacultyForm
								onSuccess={() => setIsCreateFacultyOpen(false)}
							/>
						</DialogContent>
					</Dialog>
				</div>

				<div className="grid gap-4">
					{faculties?.map((faculty) => {
						const isMjiit = faculty.code.toUpperCase() === MJIIT_FACULTY_CODE;
						return (
							<Card key={faculty.id}>
								<CardHeader className="pb-3">
									<CardTitle className="flex items-center justify-between text-base">
										<div className="flex items-center gap-2">
											<Building2 className="h-4 w-4 text-muted-foreground" />
											<span>
												{faculty.name} ({faculty.code})
											</span>
											{isMjiit && (
												<Badge className="text-xs" variant="secondary">
													iKohza enabled
												</Badge>
											)}
										</div>
										<div className="flex items-center gap-1">
											<Dialog
												onOpenChange={(open) =>
													!open && setEditingFaculty(null)
												}
												open={editingFaculty?.id === faculty.id}
											>
												<DialogTrigger asChild>
													<Button
														onClick={() => setEditingFaculty(faculty)}
														size="icon"
														variant="ghost"
													>
														<Pencil className="h-4 w-4" />
													</Button>
												</DialogTrigger>
												<DialogContent>
													<DialogHeader>
														<DialogTitle>Edit Faculty</DialogTitle>
													</DialogHeader>
													<EditFacultyForm
														faculty={faculty}
														onSuccess={() => setEditingFaculty(null)}
													/>
												</DialogContent>
											</Dialog>
											<Button
												onClick={() =>
													setDeleteState({
														type: "faculty",
														id: faculty.id,
														name: `${faculty.name} (${faculty.code})`,
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
										<AccordionItem value="departments">
											<AccordionTrigger className="py-2 text-sm hover:no-underline">
												<div className="flex items-center gap-2">
													<GraduationCap className="h-4 w-4" />
													<span>
														Departments ({faculty.departments.length})
													</span>
												</div>
											</AccordionTrigger>
											<AccordionContent>
												<div className="space-y-4 pt-2">
													<div className="grid gap-2">
														{faculty.departments.map((dept) => (
															<div
																className="flex items-center justify-between rounded-md border p-2 text-sm"
																key={dept.id}
															>
																<span>
																	{dept.name} ({dept.code})
																</span>
																<div className="flex items-center gap-1">
																	<Dialog
																		onOpenChange={(open) =>
																			!open && setEditingDepartment(null)
																		}
																		open={editingDepartment?.id === dept.id}
																	>
																		<DialogTrigger asChild>
																			<Button
																				onClick={() =>
																					setEditingDepartment(dept)
																				}
																				size="icon"
																				variant="ghost"
																			>
																				<Pencil className="h-3 w-3" />
																			</Button>
																		</DialogTrigger>
																		<DialogContent>
																			<DialogHeader>
																				<DialogTitle>
																					Edit Department
																				</DialogTitle>
																			</DialogHeader>
																			<EditDepartmentForm
																				department={dept}
																				onSuccess={() =>
																					setEditingDepartment(null)
																				}
																			/>
																		</DialogContent>
																	</Dialog>
																	<Button
																		onClick={() =>
																			setDeleteState({
																				type: "department",
																				id: dept.id,
																				name: `${dept.name} (${dept.code})`,
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
														{faculty.departments.length === 0 && (
															<p className="text-muted-foreground text-sm italic">
																No departments added yet.
															</p>
														)}
													</div>
													<Dialog
														onOpenChange={(open) =>
															setCreatingDeptForFacultyId(
																open ? faculty.id : null,
															)
														}
														open={creatingDeptForFacultyId === faculty.id}
													>
														<DialogTrigger asChild>
															<Button
																className="w-full"
																size="sm"
																variant="outline"
															>
																<Plus className="mr-2 h-3 w-3" />
																Add Department
															</Button>
														</DialogTrigger>
														<DialogContent>
															<DialogHeader>
																<DialogTitle>
																	Add Department to {faculty.code}
																</DialogTitle>
															</DialogHeader>
															<CreateDepartmentForm
																facultyId={faculty.id}
																onSuccess={() =>
																	setCreatingDeptForFacultyId(null)
																}
															/>
														</DialogContent>
													</Dialog>
												</div>
											</AccordionContent>
										</AccordionItem>

										<AccordionItem value="ikohzas">
											<AccordionTrigger className="py-2 text-sm hover:no-underline">
												<div className="flex items-center gap-2">
													<Users className="h-4 w-4" />
													<span>Ikohzas ({faculty.ikohzas.length})</span>
												</div>
											</AccordionTrigger>
											<AccordionContent>
												<div className="space-y-4 pt-2">
													<div className="grid gap-2">
														{faculty.ikohzas.map((ikohza) => (
															<div
																className="flex items-center justify-between rounded-md border p-2 text-sm"
																key={ikohza.id}
															>
																<div>
																	<span className="font-medium">
																		{ikohza.name} ({ikohza.code})
																	</span>
																	{ikohza.leaderName && (
																		<p className="text-muted-foreground text-xs">
																			Leader: {ikohza.leaderName}
																		</p>
																	)}
																</div>
																<div className="flex items-center gap-1">
																	<Dialog
																		onOpenChange={(open) =>
																			!open && setEditingIkohza(null)
																		}
																		open={editingIkohza?.id === ikohza.id}
																	>
																		<DialogTrigger asChild>
																			<Button
																				onClick={() => setEditingIkohza(ikohza)}
																				size="icon"
																				variant="ghost"
																			>
																				<Pencil className="h-3 w-3" />
																			</Button>
																		</DialogTrigger>
																		<DialogContent>
																			<DialogHeader>
																				<DialogTitle>Edit Ikohza</DialogTitle>
																			</DialogHeader>
																			<EditIkohzaForm
																				ikohza={ikohza}
																				onSuccess={() => setEditingIkohza(null)}
																			/>
																		</DialogContent>
																	</Dialog>
																	<Button
																		onClick={() =>
																			setDeleteState({
																				type: "ikohza",
																				id: ikohza.id,
																				name: `${ikohza.name} (${ikohza.code})`,
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
														{faculty.ikohzas.length === 0 && (
															<p className="text-muted-foreground text-sm italic">
																No ikohzas added yet.
															</p>
														)}
													</div>
													{isMjiit ? (
														<Dialog
															onOpenChange={(open) =>
																setCreatingIkohzaForFacultyId(
																	open ? faculty.id : null,
																)
															}
															open={creatingIkohzaForFacultyId === faculty.id}
														>
															<DialogTrigger asChild>
																<Button
																	className="w-full"
																	size="sm"
																	variant="outline"
																>
																	<Plus className="mr-2 h-3 w-3" />
																	Add Ikohza
																</Button>
															</DialogTrigger>
															<DialogContent>
																<DialogHeader>
																	<DialogTitle>
																		Add Ikohza to {faculty.code}
																	</DialogTitle>
																</DialogHeader>
																<CreateIkohzaForm
																	facultyId={faculty.id}
																	onSuccess={() =>
																		setCreatingIkohzaForFacultyId(null)
																	}
																/>
															</DialogContent>
														</Dialog>
													) : (
														<Tooltip>
															<TooltipTrigger asChild>
																<div>
																	<Button
																		className="w-full"
																		disabled
																		size="sm"
																		variant="outline"
																	>
																		<Plus className="mr-2 h-3 w-3" />
																		Add Ikohza
																	</Button>
																</div>
															</TooltipTrigger>
															<TooltipContent>
																<p>Only MJIIT faculty can have iKohzas</p>
															</TooltipContent>
														</Tooltip>
													)}
												</div>
											</AccordionContent>
										</AccordionItem>
									</Accordion>
								</CardContent>
							</Card>
						);
					})}
					{faculties?.length === 0 && (
						<div className="py-8 text-center text-muted-foreground">
							No faculties found. Add one to get started.
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
					organizationType={deleteState?.type ?? "faculty"}
				/>
			</div>
		</TooltipProvider>
	);
}
