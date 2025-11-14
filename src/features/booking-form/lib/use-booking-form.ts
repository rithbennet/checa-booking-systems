/**
 * Booking form business logic hook - RHF-first architecture
 * React Hook Form is the single source of truth for field state
 */

import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast as sonnerToast } from "sonner";
import { useCreateBooking } from "@/entities/booking/api/use-bookings";
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
import type { BookingProfile } from "../model/types";
import { useBookingWizardStore } from "../model/use-booking-wizard-store";

type ServiceItemField = NonNullable<
  CreateBookingInput["serviceItems"]
>[number] & { id: string };

type WorkspaceField = NonNullable<
  CreateBookingInput["workspaceBookings"]
>[number] & { id: string };

interface UseBookingFormOptions {
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

export function useBookingForm({
  userType,
  userStatus,
  services,
  profile,
  initialDraft,
  initialServices = [],
  draftKey,
}: UseBookingFormOptions) {
  // Build services map from props
  const servicesMap = useMemo(
    () => new Map(services.map((s) => [s.id, s] as const)),
    [services]
  );

  const createBookingMutation = useCreateBooking();

  // Wizard store for UI/meta state only
  const {
    currentStep,
    isServiceDialogOpen,
    setCurrentStep,
    setServiceDialogOpen,
    markSaved,
    resetWizard,
  } = useBookingWizardStore();

  // Build default values: base -> draft -> initialServices -> profile
  const defaultValues = useMemo(() => {
    const baseDefaults = normalizeBookingInput({});
    const draftDefaults = initialDraft
      ? normalizeBookingInput(initialDraft)
      : undefined;

    const seededServices = initialServices.map(({ service, item }) => ({
      ...createDefaultServiceItem(service),
      ...(item ?? {}),
    }));

    return {
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
    };
  }, [initialDraft, initialServices, profile]);

  // Initialize form with React Hook Form
  const form = useForm<CreateBookingInput>({
    resolver: zodResolver(createBookingInputSchema),
    mode: "onChange",
    defaultValues,
  });

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

  const handleSaveDraft = () => {
    const data = form.getValues();
    saveDraftToStorage<CreateBookingInput>(draftKey, data);
    markSaved(Date.now());
    sonnerToast.success("Draft saved", {
      description: "Your booking has been saved as a draft.",
    });
  };

  const onSubmit = async (data: CreateBookingInput): Promise<void> => {
    try {
      // Enrich with category metadata for validation
      const enriched = attachMetadataForValidation(data, services);

      const result = await createBookingMutation.mutateAsync(enriched);

      // Clear draft and reset wizard
      clearDraft(draftKey);
      resetWizard();

      sonnerToast.success("Booking submitted", {
        description: `Your booking request ${result.referenceNumber} has been submitted successfully.`,
      });
      window.location.href = `/bookings/${result.id}`;
    } catch (error) {
      sonnerToast.error("Error", {
        description:
          error instanceof Error
            ? error.message
            : "Failed to submit booking. Please try again.",
      });
    }
  };

  const getServiceForField = (serviceId: string): Service | undefined => {
    return servicesMap.get(serviceId);
  };

  const selectedServiceIds = fields.map((field) => field.serviceId);

  const handleAddWorkspace = () => {
    const defaultWorkspace: WorkspaceBookingInput = {
      startDate: new Date(),
      endDate: new Date(),
      equipmentIds: [],
      addOnIds: [],
    };
    appendWorkspace(defaultWorkspace);
    sonnerToast.success("Workspace added", {
      description: "Workspace booking has been added to your booking.",
    });
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
    selectedServiceIds,
    handleAddService,
    handleAddSample,
    handleAddWorkspace,
    handleRemoveService,
    handleRemoveServiceGroup,
    handleRemoveWorkspace,
    handleServiceUpdate,
    handleWorkspaceUpdate,
    handleSaveDraft,
    onSubmit,
    getServiceForField,
    setServiceDialogOpen,
    setCurrentStep,
    isSubmitting: createBookingMutation.isPending,
  };
}
