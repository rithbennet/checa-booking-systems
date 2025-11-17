/**
 * Booking form business logic hook - RHF-first architecture
 * React Hook Form is the single source of truth for field state
 */

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useRef, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast as sonnerToast } from "sonner";
import {
  useCreateBookingDraft,
  useDeleteBookingDraft,
  useSaveBookingDraft,
  useSubmitBooking,
} from "@/entities/booking/api/use-bookings";
import {
  clearDraft,
  saveDraft as saveDraftToStorage,
} from "@/entities/booking/lib/draftService";
import {
  attachMetadataForValidation,
  createDefaultServiceItem,
  normalizeBookingInput,
} from "@/entities/booking/lib/factories";
import type {
  BookingServiceItemInput,
  CreateBookingInput,
  WorkspaceBookingInput,
} from "@/entities/booking/model/schemas";
import { createBookingInputSchema } from "@/entities/booking/model/schemas";
import type { Service, UserType } from "@/entities/service";
import { getServicePrice } from "@/entities/service";
import {
  calculateWorkspaceEndDate,
  doDateRangesOverlap,
  normalizeDate as normalizeWorkspaceDate,
} from "@/features/booking-form/lib/workspace-utils";
import type { BookingProfile } from "../model/types";
import { useBookingWizardStore } from "../model/use-booking-wizard-store";

// (optional) UI field map not needed for schema-driven validation here

type ServiceItemField = NonNullable<
  CreateBookingInput["serviceItems"]
>[number] & { id: string };

type WorkspaceField = NonNullable<
  CreateBookingInput["workspaceBookings"]
>[number] & { id: string };

type BookingMode = "new" | "edit";

interface UseBookingFormOptions {
  mode?: BookingMode;
  bookingId?: string;
  initialData?: CreateBookingInput;
  userType: UserType;
  userStatus?: string;
  services: Service[];
  profile: BookingProfile;
  initialDraft?: Partial<CreateBookingInput> | null;
  initialServices?: Array<{
    service: Service;
    item?: Partial<BookingServiceItemInput>;
  }>;
  draftKey: string;
}

// Step-level validation field mapping
const STEP_FIELDS: Record<number, Array<keyof CreateBookingInput>> = {
  1: ["serviceItems", "workspaceBookings"], // Services step
  2: ["projectDescription", "preferredStartDate", "preferredEndDate"], // Project info
  3: ["payerType", "billingName", "billingEmail"], // Billing
  4: [], // Review - full validation
};

export function useBookingForm({
  mode = "new",
  bookingId: bookingIdProp,
  initialData,
  userType,
  userStatus,
  services,
  profile,
  initialDraft,
  initialServices = [],
  draftKey,
}: UseBookingFormOptions) {
  // Track booking ID for draft mode
  const [bookingId, _setBookingId] = useState<string | undefined>(
    bookingIdProp
  );
  const [lastSavedAt, setLastSavedAt] = useState<string | undefined>();
  // Controls whether the blocking submitting dialog is shown after validation passes
  const [isSubmittingDialog, setIsSubmittingDialog] = useState(false);

  // Track if step 1 has been saved (for exit guard)
  // In edit mode, we assume step 1 was saved since the draft already exists
  const hasSavedStep1Ref = useRef(mode === "edit");

  // Build services map from props
  const servicesMap = useMemo(
    () => new Map(services.map((s) => [s.id, s] as const)),
    [services]
  );

  // Mutations
  const _createDraftMutation = useCreateBookingDraft();
  const saveDraftMutation = useSaveBookingDraft();
  const submitMutation = useSubmitBooking();
  const deleteMutation = useDeleteBookingDraft();

  // Local UI state for services/workspace validation dialog (hierarchical)
  type ServiceSampleIssues = { sampleIndex: number; issues: string[] };
  type ServiceIssuesGroup = {
    serviceId: string;
    serviceName: string;
    issuesBySample: ServiceSampleIssues[];
  };
  type WorkspaceIssues = { slotIndex: number; issues: string[] };
  const [servicesValidation, setServicesValidation] = useState<{
    open: boolean;
    services: ServiceIssuesGroup[];
    workspaces: WorkspaceIssues[];
  }>({ open: false, services: [], workspaces: [] });

  // Wizard store for UI/meta state only
  const {
    currentStep,
    isServiceDialogOpen,
    setCurrentStep,
    setServiceDialogOpen,
    markSaved,
    resetWizard,
    clearPersistAndRehydrate,
    draftId,
    setDraftId,
  } = useBookingWizardStore();

  // Build default values: base -> initialData (for edit) -> draft -> initialServices -> profile
  const defaultValues = useMemo(() => {
    // Helper: normalize workspace booking dates to start-of-day so validation is stable
    const normalizeWorkspaceDatesInInput = (
      input: Partial<CreateBookingInput>
    ): CreateBookingInput => {
      const base = normalizeBookingInput(input as Partial<CreateBookingInput>);
      return {
        ...base,
        workspaceBookings: base.workspaceBookings.map(
          (ws: WorkspaceBookingInput) => ({
            ...ws,
            startDate: ws.startDate
              ? normalizeWorkspaceDate(new Date(ws.startDate))
              : ws.startDate,
            endDate: ws.endDate
              ? normalizeWorkspaceDate(new Date(ws.endDate))
              : ws.endDate,
          })
        ),
      };
    };

    // If we have initialData from edit mode, use it as the base and enrich with category metadata
    if (initialData) {
      const normalized = normalizeWorkspaceDatesInInput(initialData);
      return attachMetadataForValidation(normalized, services);
    }

    const baseDefaults = normalizeBookingInput({});
    const draftDefaults = initialDraft
      ? normalizeBookingInput(initialDraft)
      : undefined;

    const seededServices = initialServices.map(({ service, item }) => ({
      ...createDefaultServiceItem(service),
      ...(item ?? {}),
    }));

    const composed: CreateBookingInput = {
      ...baseDefaults,
      ...(draftDefaults ?? {}),
      serviceItems:
        draftDefaults?.serviceItems && draftDefaults.serviceItems.length > 0
          ? draftDefaults.serviceItems
          : seededServices.length > 0
          ? seededServices
          : [],
      billingName: draftDefaults?.billingName ?? profile?.fullName ?? undefined,
      billingEmail: draftDefaults?.billingEmail ?? profile?.email ?? undefined,
      payerType: draftDefaults?.payerType,
      billingAddressDisplay: draftDefaults?.billingAddressDisplay,
      billingPhone: draftDefaults?.billingPhone,
      utmCampus: draftDefaults?.utmCampus,
      preferredStartDate: draftDefaults?.preferredStartDate,
      preferredEndDate: draftDefaults?.preferredEndDate,
      projectDescription:
        draftDefaults?.projectDescription ?? baseDefaults.projectDescription,
      additionalNotes:
        draftDefaults?.additionalNotes ?? baseDefaults.additionalNotes,
      notes: draftDefaults?.notes ?? baseDefaults.notes,
      status: draftDefaults?.status ?? baseDefaults.status,
      workspaceBookings:
        draftDefaults?.workspaceBookings ??
        baseDefaults.workspaceBookings ??
        [],
    };

    // Normalize any workspace booking dates from draft/defaults so validation matches UI
    const composedNormalized = normalizeWorkspaceDatesInInput(composed);

    // Enrich with category metadata so sample validation (sampleName/sampleType) fires immediately on Step 1
    return attachMetadataForValidation(composedNormalized, services);
  }, [initialData, initialDraft, initialServices, profile, services]);

  // Initialize form with React Hook Form
  const form = useForm<CreateBookingInput>({
    resolver: zodResolver(createBookingInputSchema),
    mode: "onChange",
    defaultValues,
  });

  // On mount in edit mode, trigger a silent validation so errors are ready when user clicks Next
  useEffect(() => {
    if (mode === "edit" && currentStep === 1) {
      void form.trigger(["serviceItems", "workspaceBookings"], {
        shouldFocus: false,
      });
    }
  }, [mode, currentStep, form]);

  const {
    fields,
    append,
    remove,
    update,
  }: {
    fields: ServiceItemField[];
    append: (value: ServiceItemField | ServiceItemField[]) => void;
    remove: (index: number | number[]) => void;
    update: (index: number, value: Partial<ServiceItemField>) => void;
  } = useFieldArray<CreateBookingInput, "serviceItems", "id">({
    control: form.control,
    name: "serviceItems",
    keyName: "id",
  });

  const {
    fields: workspaceFields,
    append: appendWorkspace,
    remove: removeWorkspace,
    update: updateWorkspace,
  }: {
    fields: WorkspaceField[];
    append: (value: WorkspaceField | WorkspaceField[]) => void;
    remove: (index: number | number[]) => void;
    update: (index: number, value: Partial<WorkspaceField>) => void;
  } = useFieldArray<CreateBookingInput, "workspaceBookings", "id">({
    control: form.control,
    name: "workspaceBookings",
    keyName: "id",
  });

  const isBlocked =
    userStatus === "pending" ||
    userStatus === "inactive" ||
    userStatus === "rejected";

  // Auto-save step 1 every 2 minutes (only if on step 1 and form is dirty)
  useEffect(() => {
    if (currentStep !== 1) return;
    if (!bookingId) return;

    const interval = setInterval(async () => {
      if (!form.formState.isDirty) return;

      try {
        const currentValues = form.getValues();
        await saveDraftMutation.mutateAsync({
          bookingId,
          data: currentValues,
        });
        // Reset dirty state after successful save
        form.reset(currentValues, { keepDirty: false });
        hasSavedStep1Ref.current = true;
        setLastSavedAt(new Date().toISOString());
        // Silent save - no toast to avoid noise
      } catch (error) {
        // Silent fail for autosave
        console.error("Autosave failed:", error);
      }
    }, 120_000); // 2 minutes

    return () => clearInterval(interval);
  }, [bookingId, currentStep, form, saveDraftMutation]);

  // Exit guard: warn if leaving step 1 without saving
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (
        currentStep === 1 &&
        !hasSavedStep1Ref.current &&
        form.formState.isDirty
      ) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [currentStep, form.formState.isDirty]);

  // Step validation and navigation
  const handleNext = async () => {
    if (currentStep === 1) {
      // Run schema-driven validation first without focusing fields
      const stepFields = STEP_FIELDS[currentStep];
      const valid = await form.trigger(stepFields as never, {
        shouldFocus: false,
      });
      // Always compute workspace overlaps; schema can't detect cross-item constraints
      const wsValues = form.getValues("workspaceBookings") || [];
      const overlapIndices = new Set<number>();
      for (let i = 0; i < wsValues.length; i++) {
        const a = wsValues[i];
        if (!a?.startDate || !a?.endDate) continue;
        const aStart = normalizeWorkspaceDate(new Date(a.startDate));
        const aEnd = normalizeWorkspaceDate(new Date(a.endDate));
        for (let j = i + 1; j < wsValues.length; j++) {
          const b = wsValues[j];
          if (!b?.startDate || !b?.endDate) continue;
          const bStart = normalizeWorkspaceDate(new Date(b.startDate));
          const bEnd = normalizeWorkspaceDate(new Date(b.endDate));
          if (doDateRangesOverlap(aStart, aEnd, bStart, bEnd)) {
            overlapIndices.add(i);
            overlapIndices.add(j);
          }
        }
      }

      if (!valid || overlapIndices.size > 0) {
        // Build hierarchical errors from form state
        const errors = form.formState.errors as Partial<
          Record<keyof CreateBookingInput, unknown>
        > & {
          serviceItems?: Array<Partial<Record<string, { message?: string }>>>;
          workspaceBookings?: Array<
            Partial<Record<string, { message?: string }>>
          >;
        };
        const serviceGroupsMap = new Map<string, ServiceIssuesGroup>();
        const workspaceIssues: WorkspaceIssues[] = [];

        // Service items
        const svcErrors = errors.serviceItems as
          | Array<Partial<Record<string, { message?: string }>>>
          | undefined;
        (fields || []).forEach((field, idx) => {
          const err = svcErrors?.[idx];
          const msgs: string[] = [];
          if (err?.sampleName?.message)
            msgs.push(String(err.sampleName.message));
          if (err?.sampleType?.message)
            msgs.push(String(err.sampleType.message));
          if (err?.quantity?.message) msgs.push(String(err.quantity.message));
          if (err?.durationMonths?.message)
            msgs.push(String(err.durationMonths.message));
          if (msgs.length > 0) {
            const sId = field.serviceId;
            const sName = servicesMap.get(sId)?.name ?? "Service";
            if (!serviceGroupsMap.has(sId)) {
              serviceGroupsMap.set(sId, {
                serviceId: sId,
                serviceName: sName,
                issuesBySample: [],
              });
            }
            const group = serviceGroupsMap.get(sId);
            if (group)
              group.issuesBySample.push({ sampleIndex: idx + 1, issues: msgs });
          }
        });

        // Workspace bookings
        const wsErrors = errors.workspaceBookings as
          | Array<Partial<Record<string, { message?: string }>>>
          | undefined;
        wsValues.forEach((_: WorkspaceBookingInput, idx: number) => {
          const err = wsErrors?.[idx];
          const msgs: string[] = [];
          if (err?.startDate?.message) msgs.push(String(err.startDate.message));
          if (err?.endDate?.message) msgs.push(String(err.endDate.message));
          if (overlapIndices.has(idx))
            msgs.push("This workspace slot overlaps with another slot");
          if (msgs.length > 0) {
            workspaceIssues.push({ slotIndex: idx + 1, issues: msgs });
          }
        });

        // No items guard
        const hasAny = (fields?.length ?? 0) > 0 || (wsValues?.length ?? 0) > 0;
        if (!hasAny) {
          workspaceIssues.push({
            slotIndex: 0,
            issues: ["Add at least one service or workspace booking."],
          });
        }

        const servicesArr = Array.from(serviceGroupsMap.values());
        if (servicesArr.length > 0 || workspaceIssues.length > 0) {
          setServicesValidation({
            open: true,
            services: servicesArr,
            workspaces: workspaceIssues,
          });
          return;
        }
      }
    }

    const stepFields = STEP_FIELDS[currentStep];
    if (stepFields && stepFields.length > 0) {
      const valid = await form.trigger(stepFields as never);
      if (!valid) {
        sonnerToast.error("Validation error", {
          description: "Please fix the errors before continuing.",
        });
        return;
      }
    }

    // Save draft on next
    if (bookingId) {
      try {
        await saveDraftMutation.mutateAsync({
          bookingId,
          data: form.getValues(),
        });
        // Mark step 1 as saved if we're on step 1
        if (currentStep === 1) {
          hasSavedStep1Ref.current = true;
        }
        setLastSavedAt(new Date().toISOString());
        sonnerToast.success("Draft saved", {
          description: "Your changes have been saved.",
        });
      } catch (error) {
        sonnerToast.error("Save failed", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
        return;
      }
    }

    setCurrentStep(Math.min(currentStep + 1, 4));
  };

  const handlePrevious = () => {
    setCurrentStep(Math.max(currentStep - 1, 1));
  };

  const handleSaveDraft = async () => {
    if (!bookingId) {
      sonnerToast.error("No booking draft", {
        description: "Please wait for the draft to be created.",
      });
      return;
    }

    try {
      await saveDraftMutation.mutateAsync({
        bookingId,
        data: form.getValues(),
      });
      // Mark step 1 as saved if we're on step 1
      if (currentStep === 1) {
        hasSavedStep1Ref.current = true;
      }
      setLastSavedAt(new Date().toISOString());
      // Also save to localStorage for quick recovery
      saveDraftToStorage<CreateBookingInput>(draftKey, form.getValues());
      markSaved(Date.now());
      sonnerToast.success("Draft saved", {
        description: "Your booking has been saved as a draft.",
      });
    } catch (error) {
      sonnerToast.error("Save failed", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  const handleDiscard = async () => {
    if (!bookingId) {
      // Just clear local draft and redirect
      clearDraft(draftKey);
      resetWizard();
      window.location.href = "/bookings";
      return;
    }

    try {
      await deleteMutation.mutateAsync(bookingId);
      clearDraft(draftKey);
      resetWizard();
      sonnerToast.success("Draft discarded", {
        description: "Your booking draft has been deleted.",
      });
      window.location.href = "/bookings";
    } catch (error) {
      sonnerToast.error("Delete failed", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  // Discard draft if step 1 wasn't saved (for exit guard)
  const discardDraftIfUnsaved = async () => {
    if (currentStep === 1 && !hasSavedStep1Ref.current && bookingId) {
      try {
        await deleteMutation.mutateAsync(bookingId);
        clearDraft(draftKey);
      } catch (error) {
        console.error("Failed to discard unsaved draft:", error);
      }
    }
  };

  const onSubmit = async (data: CreateBookingInput): Promise<void> => {
    if (!bookingId) {
      sonnerToast.error("No booking draft", {
        description: "Please wait for the draft to be created.",
      });
      return;
    }

    try {
      // First, validate the full form
      const valid = await form.trigger();
      if (!valid) {
        sonnerToast.error("Validation error", {
          description: "Please fix all errors before submitting.",
        });
        return;
      }

      // Validation passed — open the submitting dialog (blocking UI)
      setIsSubmittingDialog(true);

      // Enrich with category metadata for validation
      const enriched = attachMetadataForValidation(data, services);

      // Save final data to draft
      await saveDraftMutation.mutateAsync({
        bookingId,
        data: enriched,
      });

      // Submit for approval
      const result = await submitMutation.mutateAsync(bookingId);

      // Clear draft and reset wizard
      clearDraft(draftKey);
      resetWizard();

      // Show appropriate message based on status
      if (result.status === "pending_user_verification") {
        sonnerToast.success("Booking submitted", {
          description:
            "Your booking has been submitted. Your account needs verification before approval.",
        });
      } else if (result.status === "pending_approval") {
        sonnerToast.success("Booking submitted", {
          description:
            "Your booking has been submitted and is pending admin approval.",
        });
      } else {
        sonnerToast.success("Booking submitted", {
          description: "Your booking request has been submitted successfully.",
        });
      }

      window.location.href = `/bookings/${bookingId}`;
    } catch (error) {
      // Close the submitting dialog on error so the user can continue editing
      setIsSubmittingDialog(false);
      sonnerToast.error("Submission failed", {
        description:
          error instanceof Error
            ? error.message
            : "Failed to submit booking. Please try again.",
      });
    }
  };

  // On mount or when bookingIdProp changes: if it's a different booking draft
  // than the persisted draftId, clear wizard meta + reset step & form.
  useEffect(() => {
    if (!bookingIdProp) return;
    if (mode === "edit" && draftId !== bookingIdProp) {
      (async () => {
        try {
          await clearPersistAndRehydrate();
        } catch (_) {
          // ignore
        }
        setDraftId(bookingIdProp);
        _setBookingId(bookingIdProp);
        setCurrentStep(1);
        hasSavedStep1Ref.current = true; // existing draft assumed saved step1
        // Do NOT wipe existing initialData; only reset if switching away mid-draft
        // If you want a hard reset of form values, uncomment below:
        // const cleared = normalizeBookingInput({});
        // form.reset(cleared, { keepDirty: false });
      })();
    }
  }, [
    bookingIdProp,
    draftId,
    mode,
    clearPersistAndRehydrate,
    setDraftId,
    setCurrentStep,
  ]);

  const handleAddService = (service: Service) => {
    const pricing = getServicePrice(service, userType);
    if (!pricing) {
      sonnerToast.error("Error", {
        description: "Pricing not available for this service.",
      });
      return;
    }

    append(createDefaultServiceItem(service));
  };

  const handleAddSample = (serviceId: string) => {
    const service = servicesMap.get(serviceId);

    if (!service) {
      sonnerToast.error("Error", {
        description: "Service not found.",
      });
      return;
    }

    const pricing = getServicePrice(service, userType);
    if (!pricing) {
      sonnerToast.error("Error", {
        description: "Pricing not available for this service.",
      });
      return;
    }

    append(createDefaultServiceItem(service));
  };

  const handleRemoveService = (index: number) => {
    remove(index);
  };

  const handleRemoveServiceGroup = (serviceId: string) => {
    const indicesToRemove = fields
      .map((field, index) => (field.serviceId === serviceId ? index : -1))
      .filter((index) => index !== -1)
      .sort((a, b) => b - a);

    indicesToRemove.forEach((index) => {
      remove(index);
    });
  };

  const handleServiceUpdate = (
    index: number,
    data: Partial<BookingServiceItemInput>
  ) => {
    const currentValues = form.getValues(`serviceItems.${index}`);
    update(index, {
      ...currentValues,
      ...data,
    });
  };

  const getServiceForField = (serviceId: string): Service | undefined => {
    return servicesMap.get(serviceId);
  };

  const selectedServiceIds = fields.map((field) => field.serviceId);

  const handleAddWorkspace = () => {
    const start = new Date();
    const defaultWorkspace: WorkspaceBookingInput = {
      startDate: start,
      // Default to 1 month (30 days inclusive)
      endDate: calculateWorkspaceEndDate(start, 1),
      equipmentIds: [],
      addOnCatalogIds: [],
    };
    appendWorkspace(defaultWorkspace);
  };

  const handleWorkspaceUpdate = (
    index: number,
    data: Partial<WorkspaceBookingInput>
  ) => {
    const currentValues = form.getValues(`workspaceBookings.${index}`);
    updateWorkspace(index, {
      ...currentValues,
      ...data,
    });
  };

  const handleRemoveWorkspace = (index: number) => {
    removeWorkspace(index);
    sonnerToast.success("Workspace removed", {
      description: "Workspace booking has been removed.",
    });
  };

  return {
    form,
    fields,
    workspaceFields,
    isBlocked,
    currentStep,
    isServiceDialogOpen,
    servicesValidationOpen: servicesValidation.open,
    servicesValidationData: {
      services: servicesValidation.services,
      workspaces: servicesValidation.workspaces,
    },
    selectedServiceIds,
    handleAddService,
    handleAddSample,
    handleAddWorkspace,
    handleRemoveService,
    handleRemoveServiceGroup,
    handleRemoveWorkspace,
    handleServiceUpdate,
    handleWorkspaceUpdate,
    handleNext,
    handlePrevious,
    handleSaveDraft,
    handleDiscard,
    discardDraftIfUnsaved,
    onSubmit,
    getServiceForField,
    setServiceDialogOpen,
    setServicesValidationOpen: (open: boolean) =>
      setServicesValidation((s) => ({ ...s, open })),
    setCurrentStep,
    isSubmitting: submitMutation.isPending,
    isSubmittingDialog,
    isSaving: saveDraftMutation.isPending,
    lastSavedAt,
    hasSavedStep1: hasSavedStep1Ref.current,
  };
}
