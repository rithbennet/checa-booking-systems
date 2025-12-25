import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
	CreateBranchInput,
	CreateCompanyInput,
	CreateDepartmentInput,
	CreateFacultyInput,
	CreateIkohzaInput,
	UpdateBranchInput,
	UpdateCompanyInput,
	UpdateDepartmentInput,
	UpdateFacultyInput,
	UpdateIkohzaInput,
} from "../model/schema";
import type { CompanyWithBranches, FacultyWithRelations } from "../model/types";
import { organizationKeys } from "./query-keys";

// ===================== Faculties =====================

export function useFaculties() {
	return useQuery<FacultyWithRelations[]>({
		queryKey: organizationKeys.faculties(),
		queryFn: async () => {
			const res = await fetch("/api/admin/organizations/faculties");
			if (!res.ok) throw new Error("Failed to fetch faculties");
			return res.json();
		},
	});
}

export function useCreateFaculty() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (data: CreateFacultyInput) => {
			const res = await fetch("/api/admin/organizations/faculties", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(data),
			});
			if (!res.ok) {
				const error = await res.json();
				throw new Error(
					error.error || error.message || "Failed to create faculty",
				);
			}
			return res.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: organizationKeys.faculties() });
		},
	});
}

export function useUpdateFaculty() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (data: UpdateFacultyInput) => {
			const res = await fetch("/api/admin/organizations/faculties", {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(data),
			});
			if (!res.ok) {
				const error = await res.json();
				throw new Error(
					error.error || error.message || "Failed to update faculty",
				);
			}
			return res.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: organizationKeys.faculties() });
		},
	});
}

export function useDeleteFaculty() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async ({
			id,
			sendEmails,
		}: {
			id: string;
			sendEmails: boolean;
		}) => {
			const res = await fetch(
				`/api/admin/organizations/faculties?id=${id}&sendEmails=${sendEmails}`,
				{
					method: "DELETE",
				},
			);
			if (!res.ok) throw new Error("Failed to delete faculty");
			return res.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: organizationKeys.faculties() });
		},
	});
}

export function useAffectedUsersByFaculty(facultyId: string) {
	return useQuery({
		queryKey: [...organizationKeys.faculties(), "affected", facultyId],
		queryFn: async () => {
			const res = await fetch(
				`/api/admin/organizations/faculties/affected?id=${facultyId}`,
			);
			if (!res.ok) throw new Error("Failed to fetch affected users");
			return res.json() as Promise<{
				users: Array<{ id: string; email: string; name: string | null }>;
			}>;
		},
		enabled: Boolean(facultyId),
	});
}

// ===================== Departments =====================

export function useCreateDepartment() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (data: CreateDepartmentInput) => {
			const res = await fetch("/api/admin/organizations/departments", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(data),
			});
			if (!res.ok) {
				const error = await res.json();
				throw new Error(
					error.error || error.message || "Failed to create department",
				);
			}
			return res.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: organizationKeys.faculties() });
		},
	});
}

export function useUpdateDepartment() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (data: UpdateDepartmentInput) => {
			const res = await fetch("/api/admin/organizations/departments", {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(data),
			});
			if (!res.ok) {
				const error = await res.json();
				throw new Error(
					error.error || error.message || "Failed to update department",
				);
			}
			return res.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: organizationKeys.faculties() });
		},
	});
}

export function useDeleteDepartment() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async ({
			id,
			sendEmails,
		}: {
			id: string;
			sendEmails: boolean;
		}) => {
			const res = await fetch(
				`/api/admin/organizations/departments?id=${id}&sendEmails=${sendEmails}`,
				{
					method: "DELETE",
				},
			);
			if (!res.ok) throw new Error("Failed to delete department");
			return res.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: organizationKeys.faculties() });
		},
	});
}

export function useAffectedUsersByDepartment(departmentId: string) {
	return useQuery({
		queryKey: [...organizationKeys.faculties(), "affected-dept", departmentId],
		queryFn: async () => {
			const res = await fetch(
				`/api/admin/organizations/departments/affected?id=${departmentId}`,
			);
			if (!res.ok) throw new Error("Failed to fetch affected users");
			return res.json() as Promise<{
				users: Array<{ id: string; email: string; name: string | null }>;
			}>;
		},
		enabled: Boolean(departmentId),
	});
}

// ===================== Ikohzas =====================

export function useCreateIkohza() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (data: CreateIkohzaInput) => {
			const res = await fetch("/api/admin/organizations/ikohzas", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(data),
			});
			if (!res.ok) {
				const error = await res.json();
				throw new Error(
					error.error || error.message || "Failed to create ikohza",
				);
			}
			return res.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: organizationKeys.faculties() });
		},
	});
}

export function useUpdateIkohza() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (data: UpdateIkohzaInput) => {
			const res = await fetch("/api/admin/organizations/ikohzas", {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(data),
			});
			if (!res.ok) {
				const error = await res.json();
				throw new Error(
					error.error || error.message || "Failed to update ikohza",
				);
			}
			return res.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: organizationKeys.faculties() });
		},
	});
}

export function useDeleteIkohza() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async ({
			id,
			sendEmails,
		}: {
			id: string;
			sendEmails: boolean;
		}) => {
			const res = await fetch(
				`/api/admin/organizations/ikohzas?id=${id}&sendEmails=${sendEmails}`,
				{
					method: "DELETE",
				},
			);
			if (!res.ok) throw new Error("Failed to delete ikohza");
			return res.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: organizationKeys.faculties() });
		},
	});
}

export function useAffectedUsersByIkohza(ikohzaId: string) {
	return useQuery({
		queryKey: [...organizationKeys.faculties(), "affected-ikohza", ikohzaId],
		queryFn: async () => {
			const res = await fetch(
				`/api/admin/organizations/ikohzas/affected?id=${ikohzaId}`,
			);
			if (!res.ok) throw new Error("Failed to fetch affected users");
			return res.json() as Promise<{
				users: Array<{ id: string; email: string; name: string | null }>;
			}>;
		},
		enabled: Boolean(ikohzaId),
	});
}

// ===================== Companies =====================

export function useCompanies() {
	return useQuery<CompanyWithBranches[]>({
		queryKey: organizationKeys.companies(),
		queryFn: async () => {
			const res = await fetch("/api/admin/organizations/companies");
			if (!res.ok) throw new Error("Failed to fetch companies");
			return res.json();
		},
	});
}

export function useCreateCompany() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (data: CreateCompanyInput) => {
			const res = await fetch("/api/admin/organizations/companies", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(data),
			});
			if (!res.ok) {
				const error = await res.json();
				throw new Error(
					error.error || error.message || "Failed to create company",
				);
			}
			return res.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: organizationKeys.companies() });
		},
	});
}

export function useUpdateCompany() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (data: UpdateCompanyInput) => {
			const res = await fetch("/api/admin/organizations/companies", {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(data),
			});
			if (!res.ok) {
				const error = await res.json();
				throw new Error(
					error.error || error.message || "Failed to update company",
				);
			}
			return res.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: organizationKeys.companies() });
		},
	});
}

export function useDeleteCompany() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async ({
			id,
			sendEmails,
		}: {
			id: string;
			sendEmails: boolean;
		}) => {
			const res = await fetch(
				`/api/admin/organizations/companies?id=${id}&sendEmails=${sendEmails}`,
				{
					method: "DELETE",
				},
			);
			if (!res.ok) throw new Error("Failed to delete company");
			return res.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: organizationKeys.companies() });
		},
	});
}

export function useAffectedUsersByCompany(companyId: string) {
	return useQuery({
		queryKey: [...organizationKeys.companies(), "affected", companyId],
		queryFn: async () => {
			const res = await fetch(
				`/api/admin/organizations/companies/affected?id=${companyId}`,
			);
			if (!res.ok) throw new Error("Failed to fetch affected users");
			return res.json() as Promise<{
				users: Array<{ id: string; email: string; name: string | null }>;
			}>;
		},
		enabled: Boolean(companyId),
	});
}

// ===================== Branches =====================

export function useCreateBranch() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (data: CreateBranchInput) => {
			const res = await fetch("/api/admin/organizations/branches", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(data),
			});
			if (!res.ok) {
				const error = await res.json();
				throw new Error(
					error.error || error.message || "Failed to create branch",
				);
			}
			return res.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: organizationKeys.companies() });
		},
	});
}

export function useUpdateBranch() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (data: UpdateBranchInput) => {
			const res = await fetch("/api/admin/organizations/branches", {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(data),
			});
			if (!res.ok) {
				const error = await res.json();
				throw new Error(
					error.error || error.message || "Failed to update branch",
				);
			}
			return res.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: organizationKeys.companies() });
		},
	});
}

export function useDeleteBranch() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async ({
			id,
			sendEmails,
		}: {
			id: string;
			sendEmails: boolean;
		}) => {
			const res = await fetch(
				`/api/admin/organizations/branches?id=${id}&sendEmails=${sendEmails}`,
				{
					method: "DELETE",
				},
			);
			if (!res.ok) throw new Error("Failed to delete branch");
			return res.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: organizationKeys.companies() });
		},
	});
}

export function useAffectedUsersByBranch(branchId: string) {
	return useQuery({
		queryKey: [...organizationKeys.companies(), "affected-branch", branchId],
		queryFn: async () => {
			const res = await fetch(
				`/api/admin/organizations/branches/affected?id=${branchId}`,
			);
			if (!res.ok) throw new Error("Failed to fetch affected users");
			return res.json() as Promise<{
				users: Array<{ id: string; email: string; name: string | null }>;
			}>;
		},
		enabled: Boolean(branchId),
	});
}
