"use client";

import { Loader2, Pencil } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
    useOnboardingOptions,
    useUpdateProfile,
    useUserProfile,
} from "@/entities/user";
import { Button } from "@/shared/ui/shadcn/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/shared/ui/shadcn/dialog";
import { Input } from "@/shared/ui/shadcn/input";
import { Label } from "@/shared/ui/shadcn/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/shared/ui/shadcn/select";

import { Textarea } from "@/shared/ui/shadcn/textarea";

// ==============================================================
// Types
// ==============================================================

interface FormState {
    firstName: string;
    lastName: string;
    phone: string;
    userIdentifier: string;
    supervisorName: string;
    facultyId: string;
    departmentId: string;
    ikohzaId: string;
    companyId: string;
    companyBranchId: string;
    newBranchName: string;
    newBranchAddress: string;
}

interface FormErrors {
    firstName?: string;
    lastName?: string;
    userIdentifier?: string;
    supervisorName?: string;
}

// ==============================================================
// Component
// ==============================================================

export function ProfileEditDialog() {
    const [open, setOpen] = useState(false);
    const [formErrors, setFormErrors] = useState<FormErrors>({});

    const { data: profile } = useUserProfile();
    const { data: options, isLoading: optionsLoading } = useOnboardingOptions();
    const updateProfile = useUpdateProfile();

    // Initialize form state from profile
    const [formState, setFormState] = useState<FormState>({
        firstName: "",
        lastName: "",
        phone: "",
        userIdentifier: "",
        supervisorName: "",
        facultyId: "",
        departmentId: "",
        ikohzaId: "",
        companyId: "",
        companyBranchId: "",
        newBranchName: "",
        newBranchAddress: "",
    });

    // Reset form when profile loads or dialog opens
    useEffect(() => {
        if (profile && open) {
            setFormState({
                firstName: profile.firstName,
                lastName: profile.lastName,
                phone: profile.phone ?? "",
                userIdentifier: profile.userIdentifier ?? "",
                supervisorName: profile.supervisorName ?? "",
                facultyId: profile.organization.facultyId ?? "",
                departmentId: profile.organization.departmentId ?? "",
                ikohzaId: profile.organization.ikohzaId ?? "",
                companyId: profile.organization.companyId ?? "",
                companyBranchId: profile.organization.companyBranchId ?? "",
                newBranchName: "",
                newBranchAddress: "",
            });
            setFormErrors({});
        }
    }, [profile, open]);

    // Determine user type
    const isInternalUser =
        profile?.userType === "mjiit_member" || profile?.userType === "utm_member";
    const isMjiit = profile?.organization.isMjiit ?? false;
    const isStudent = profile?.academicType === "student";

    // Filter departments/ikohzas by selected faculty
    const filteredDepartments = useMemo(() => {
        if (!options?.departments || !formState.facultyId) return [];
        return options.departments.filter(
            (d) => d.facultyId === formState.facultyId,
        );
    }, [options?.departments, formState.facultyId]);

    const filteredIkohzas = useMemo(() => {
        if (!options?.ikohzas || !formState.facultyId) return [];
        return options.ikohzas.filter((i) => i.facultyId === formState.facultyId);
    }, [options?.ikohzas, formState.facultyId]);

    // Filter branches by selected company
    const filteredBranches = useMemo(() => {
        if (!options?.companyBranches || !formState.companyId) return [];
        return options.companyBranches.filter(
            (b) => b.companyId === formState.companyId,
        );
    }, [options?.companyBranches, formState.companyId]);

    // Handle input changes
    const handleChange = (field: keyof FormState, value: string) => {
        setFormState((prev) => ({ ...prev, [field]: value }));
        if (formErrors[field as keyof FormErrors]) {
            setFormErrors((prev) => ({ ...prev, [field]: undefined }));
        }
    };

    // Handle faculty change - reset department/ikohza
    const handleFacultyChange = (value: string) => {
        setFormState((prev) => ({
            ...prev,
            facultyId: value,
            departmentId: "",
            ikohzaId: "",
        }));
    };

    // Handle company change - reset branch
    const handleCompanyChange = (value: string) => {
        setFormState((prev) => ({
            ...prev,
            companyId: value,
            companyBranchId: "",
            newBranchName: "",
            newBranchAddress: "",
        }));
    };

    // Handle branch change - support adding new branch
    const handleBranchChange = (value: string) => {
        if (value === "new") {
            setFormState((prev) => ({
                ...prev,
                companyBranchId: "",
            }));
        } else {
            setFormState((prev) => ({
                ...prev,
                companyBranchId: value,
                newBranchName: "",
                newBranchAddress: "",
            }));
        }
    };

    // Validate form
    const validateForm = (): boolean => {
        const errors: FormErrors = {};

        if (!formState.firstName.trim()) {
            errors.firstName = "First name is required";
        }
        if (!formState.lastName.trim()) {
            errors.lastName = "Last name is required";
        }

        if (isInternalUser) {
            if (!formState.userIdentifier.trim()) {
                errors.userIdentifier = "Matric number or staff ID is required";
            }
            if (isStudent && !formState.supervisorName.trim()) {
                errors.supervisorName = "Supervisor name is required for students";
            }
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            await updateProfile.mutateAsync({
                firstName: formState.firstName.trim(),
                lastName: formState.lastName.trim(),
                phone: formState.phone || null,
                userIdentifier: formState.userIdentifier || undefined,
                supervisorName: formState.supervisorName || null,
                facultyId: formState.facultyId || null,
                departmentId: formState.departmentId || null,
                ikohzaId: formState.ikohzaId || null,
                companyId: formState.companyId || null,
                companyBranchId: formState.companyBranchId || null,
                // Include new branch fields if creating a new branch
                ...(formState.companyId &&
                    !formState.companyBranchId &&
                    formState.newBranchName && {
                    newBranchName: formState.newBranchName,
                    newBranchAddress: formState.newBranchAddress || undefined,
                }),
            });

            toast.success("Profile updated successfully");
            setOpen(false);
        } catch (error) {
            toast.error(
                error instanceof Error ? error.message : "Failed to update profile",
            );
        }
    };

    return (
        <Dialog onOpenChange={setOpen} open={open}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit Profile
                </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Edit Profile</DialogTitle>
                    <DialogDescription>
                        Update your profile information below.
                    </DialogDescription>
                </DialogHeader>

                {optionsLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <form className="space-y-4" onSubmit={handleSubmit}>
                        {/* Basic Info */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="firstName">
                                    First Name <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    aria-invalid={formErrors.firstName ? "true" : "false"}
                                    id="firstName"
                                    onChange={(e) => handleChange("firstName", e.target.value)}
                                    value={formState.firstName}
                                />
                                {formErrors.firstName && (
                                    <p className="text-red-600 text-sm">{formErrors.firstName}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastName">
                                    Last Name <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    aria-invalid={formErrors.lastName ? "true" : "false"}
                                    id="lastName"
                                    onChange={(e) => handleChange("lastName", e.target.value)}
                                    value={formState.lastName}
                                />
                                {formErrors.lastName && (
                                    <p className="text-red-600 text-sm">{formErrors.lastName}</p>
                                )}
                            </div>
                        </div>

                        {/* Phone */}
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input
                                id="phone"
                                onChange={(e) => handleChange("phone", e.target.value)}
                                placeholder="Enter phone number (optional)"
                                type="tel"
                                value={formState.phone}
                            />
                        </div>

                        {/* Internal User Fields */}
                        {isInternalUser && (
                            <>
                                {/* Faculty Selection */}
                                <div className="space-y-2">
                                    <Label htmlFor="faculty">Faculty</Label>
                                    <Select
                                        onValueChange={handleFacultyChange}
                                        value={formState.facultyId}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Faculty" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {options?.faculties.map((faculty) => (
                                                <SelectItem key={faculty.id} value={faculty.id}>
                                                    {faculty.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Department or Ikohza based on faculty type */}
                                {formState.facultyId && (
                                    <div className="space-y-2">
                                        {isMjiit ? (
                                            <>
                                                <Label htmlFor="ikohza">iKohza</Label>
                                                <Select
                                                    onValueChange={(value) =>
                                                        handleChange("ikohzaId", value)
                                                    }
                                                    value={formState.ikohzaId}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select iKohza" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {filteredIkohzas.map((ikohza) => (
                                                            <SelectItem key={ikohza.id} value={ikohza.id}>
                                                                {ikohza.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </>
                                        ) : (
                                            <>
                                                <Label htmlFor="department">Department</Label>
                                                <Select
                                                    onValueChange={(value) =>
                                                        handleChange("departmentId", value)
                                                    }
                                                    value={formState.departmentId}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select Department" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {filteredDepartments.map((dept) => (
                                                            <SelectItem key={dept.id} value={dept.id}>
                                                                {dept.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </>
                                        )}
                                    </div>
                                )}

                                {/* Matric/Staff ID */}
                                <div className="space-y-2">
                                    <Label htmlFor="userIdentifier">
                                        {isStudent ? "Matric Number" : "Staff ID"}{" "}
                                        <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        aria-invalid={formErrors.userIdentifier ? "true" : "false"}
                                        id="userIdentifier"
                                        onChange={(e) =>
                                            handleChange("userIdentifier", e.target.value)
                                        }
                                        placeholder={
                                            isStudent
                                                ? "Enter your matric number"
                                                : "Enter your staff ID"
                                        }
                                        value={formState.userIdentifier}
                                    />
                                    {formErrors.userIdentifier && (
                                        <p className="text-red-600 text-sm">
                                            {formErrors.userIdentifier}
                                        </p>
                                    )}
                                </div>

                                {/* Supervisor Name (for students) */}
                                {isStudent && (
                                    <div className="space-y-2">
                                        <Label htmlFor="supervisorName">
                                            Supervisor Name <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            aria-invalid={
                                                formErrors.supervisorName ? "true" : "false"
                                            }
                                            id="supervisorName"
                                            onChange={(e) =>
                                                handleChange("supervisorName", e.target.value)
                                            }
                                            placeholder="Enter your supervisor's name"
                                            value={formState.supervisorName}
                                        />
                                        {formErrors.supervisorName && (
                                            <p className="text-red-600 text-sm">
                                                {formErrors.supervisorName}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </>
                        )}

                        {/* External User Fields */}
                        {!isInternalUser && profile?.userType === "external_member" && (
                            <>
                                {/* Company Selection */}
                                <div className="space-y-2">
                                    <Label htmlFor="company">Company</Label>
                                    <Select
                                        onValueChange={handleCompanyChange}
                                        value={formState.companyId}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Company" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {options?.companies.map((company) => (
                                                <SelectItem key={company.id} value={company.id}>
                                                    {company.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Branch Selection */}
                                {formState.companyId && (
                                    <div className="space-y-2">
                                        <Label htmlFor="branch">Branch</Label>
                                        <Select
                                            onValueChange={handleBranchChange}
                                            value={
                                                formState.companyBranchId ||
                                                (formState.newBranchName ? "new" : "")
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Branch or Add New" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {filteredBranches.map((branch) => (
                                                    <SelectItem key={branch.id} value={branch.id}>
                                                        {branch.name}
                                                        {branch.city && ` - ${branch.city}`}
                                                    </SelectItem>
                                                ))}
                                                <SelectItem value="new">
                                                    <span className="font-medium text-primary">
                                                        + Add New Branch
                                                    </span>
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                {/* New Branch Input Fields */}
                                {formState.companyId &&
                                    !formState.companyBranchId &&
                                    (formState.newBranchName !== undefined ||
                                        filteredBranches.length === 0) && (
                                        <div className="space-y-4 rounded-lg border bg-muted/50 p-4">
                                            <p className="text-muted-foreground text-sm">
                                                {filteredBranches.length === 0
                                                    ? "No branches found. Please add a new branch."
                                                    : "Enter details for the new branch:"}
                                            </p>
                                            <div className="space-y-2">
                                                <Label htmlFor="newBranchName">Branch Name *</Label>
                                                <Input
                                                    id="newBranchName"
                                                    onChange={(e) =>
                                                        handleChange("newBranchName", e.target.value)
                                                    }
                                                    placeholder="e.g., Headquarters, KL Office"
                                                    value={formState.newBranchName}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="newBranchAddress">
                                                    Branch Address (optional)
                                                </Label>
                                                <Textarea
                                                    id="newBranchAddress"
                                                    onChange={(e) =>
                                                        handleChange("newBranchAddress", e.target.value)
                                                    }
                                                    placeholder="Full address of the branch"
                                                    rows={3}
                                                    value={formState.newBranchAddress}
                                                />
                                            </div>
                                        </div>
                                    )}
                            </>
                        )}

                        <DialogFooter>
                            <Button
                                onClick={() => setOpen(false)}
                                type="button"
                                variant="outline"
                            >
                                Cancel
                            </Button>
                            <Button disabled={updateProfile.isPending} type="submit">
                                {updateProfile.isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    "Save Changes"
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}
