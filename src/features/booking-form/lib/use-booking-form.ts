/**
 * Booking form business logic hook
 * Contains all business logic for the booking form
 */

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast as sonnerToast } from "sonner";
import { useCreateBooking } from "@/entities/booking/api/use-bookings";
import type {
  BookingServiceItemInput,
  CreateBookingInput,
  WorkspaceBookingInput,
} from "@/entities/booking/model/schemas";
import { createBookingInputSchema } from "@/entities/booking/model/schemas";
import type { Service, UserType } from "@/entities/service";
import { getServicePrice } from "@/entities/service";
import { useBookingStore } from "../model/use-booking-store";

type ServiceItemField = NonNullable<
  CreateBookingInput["serviceItems"]
>[number] & { id: string };

type WorkspaceField = NonNullable<
  CreateBookingInput["workspaceBookings"]
>[number] & { id: string };

interface UseBookingFormOptions {
  userType: UserType;
  userStatus?: string;
  initialServices?: Array<{
    service: Service;
    item: Partial<BookingServiceItemInput>;
  }>;
}

export function useBookingForm({
  userType,
  userStatus,
  initialServices = [],
}: UseBookingFormOptions) {
  const {
    formData: storeFormData,
    isServiceDialogOpen,
    currentStep,
    setFormData,
    addService: addServiceToStore,
    removeService: removeServiceFromStore,
    updateServiceItem: updateServiceItemInStore,
    setServiceDialogOpen,
    setCurrentStep,
    clearDraft,
    getService,
  } = useBookingStore();

  const createBookingMutation = useCreateBooking();

  // Initialize services map from initial services
  useEffect(() => {
    if (initialServices.length > 0) {
      const currentMap = useBookingStore.getState().servicesMap;
      const map = new Map(currentMap);
      initialServices.forEach(({ service }) => {
        map.set(service.id, service);
      });
      useBookingStore.setState({ servicesMap: map });
    }
  }, [initialServices]);

  // Initialize form with React Hook Form
  const form = useForm<CreateBookingInput>({
    resolver: zodResolver(createBookingInputSchema),
    mode: "onChange",
    defaultValues: {
      serviceItems:
        storeFormData.serviceItems && storeFormData.serviceItems.length > 0
          ? storeFormData.serviceItems.map((item: BookingServiceItemInput) => ({
              serviceId: item.serviceId ?? "",
              quantity: item.quantity ?? 1,
              durationMonths: item.durationMonths ?? 0,
              sampleType: item.sampleType,
              sampleDetails: item.sampleDetails,
              testingMethod: item.testingMethod,
              samplePreparation: item.samplePreparation,
              temperatureControlled: item.temperatureControlled ?? false,
              lightSensitive: item.lightSensitive ?? false,
              hazardousMaterial: item.hazardousMaterial ?? false,
              inertAtmosphere: item.inertAtmosphere ?? false,
              equipmentIds: item.equipmentIds ?? [],
              otherEquipmentRequests: item.otherEquipmentRequests ?? [],
              addOnIds: item.addOnIds ?? [],
              sampleName: item.sampleName,
              sampleHazard: item.sampleHazard,
              degasConditions: item.degasConditions,
              solventSystem: item.solventSystem,
              solvents: item.solvents,
              solventComposition: item.solventComposition,
              columnType: item.columnType,
              flowRate: item.flowRate,
              wavelength: item.wavelength,
              expectedRetentionTime: item.expectedRetentionTime,
              notes: item.notes,
              expectedCompletionDate: item.expectedCompletionDate,
              actualCompletionDate: item.actualCompletionDate,
              turnaroundEstimate: item.turnaroundEstimate,
            }))
          : initialServices.map(({ item, service }) => ({
              serviceId: item.serviceId ?? service.id ?? "",
              quantity: item.quantity ?? 1,
              durationMonths: item.durationMonths ?? 0,
              sampleType: item.sampleType,
              sampleDetails: item.sampleDetails,
              testingMethod: item.testingMethod,
              samplePreparation: item.samplePreparation,
              temperatureControlled: item.temperatureControlled ?? false,
              lightSensitive: item.lightSensitive ?? false,
              hazardousMaterial: item.hazardousMaterial ?? false,
              inertAtmosphere: item.inertAtmosphere ?? false,
              equipmentIds: item.equipmentIds ?? [],
              otherEquipmentRequests: item.otherEquipmentRequests ?? [],
              addOnIds: item.addOnIds ?? [],
              sampleName: item.sampleName,
              sampleHazard: item.sampleHazard,
              degasConditions: item.degasConditions,
              solventSystem: item.solventSystem,
              solvents: item.solvents,
              solventComposition: item.solventComposition,
              columnType: item.columnType,
              flowRate: item.flowRate,
              wavelength: item.wavelength,
              expectedRetentionTime: item.expectedRetentionTime,
              notes: item.notes,
            })),
      workspaceBookings:
        storeFormData.workspaceBookings?.map((w: WorkspaceBookingInput) => ({
          startDate: w.startDate ?? new Date(),
          endDate: w.endDate ?? new Date(),
          equipmentIds: w.equipmentIds ?? [],
          specialEquipment: w.specialEquipment,
          preferredTimeSlot: w.preferredTimeSlot,
          purpose: w.purpose,
          notes: w.notes,
          addOnIds: w.addOnIds ?? [],
        })) ?? [],
      projectDescription: storeFormData.projectDescription ?? "",
      additionalNotes: storeFormData.additionalNotes ?? "",
      payerType: storeFormData.payerType,
      billingName: storeFormData.billingName,
      billingAddressDisplay: storeFormData.billingAddressDisplay,
      billingPhone: storeFormData.billingPhone,
      billingEmail: storeFormData.billingEmail,
      utmCampus: storeFormData.utmCampus,
    } as Partial<CreateBookingInput>,
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
  // Sync form with store (normalize to ensure required fields exist)
  useEffect(() => {
    if (storeFormData.serviceItems && storeFormData.serviceItems.length > 0) {
      const normalized: CreateBookingInput = {
        ...storeFormData,
        serviceItems: storeFormData.serviceItems.map(
          (it: BookingServiceItemInput) => ({
            serviceId: it.serviceId ?? "",
            quantity: it.quantity ?? 1,
            durationMonths: it.durationMonths ?? 0,
            temperatureControlled: it.temperatureControlled ?? false,
            lightSensitive: it.lightSensitive ?? false,
            hazardousMaterial: it.hazardousMaterial ?? false,
            inertAtmosphere: it.inertAtmosphere ?? false,
            equipmentIds: it.equipmentIds ?? [],
            otherEquipmentRequests: it.otherEquipmentRequests ?? [],
            addOnIds: it.addOnIds ?? [],
            sampleName: it.sampleName,
            sampleType: it.sampleType,
            sampleDetails: it.sampleDetails,
            testingMethod: it.testingMethod,
            samplePreparation: it.samplePreparation,
            expectedCompletionDate: it.expectedCompletionDate,
            actualCompletionDate: it.actualCompletionDate,
            turnaroundEstimate: it.turnaroundEstimate,
            sampleHazard: it.sampleHazard,
            degasConditions: it.degasConditions,
            solventSystem: it.solventSystem,
            solvents: it.solvents,
            solventComposition: it.solventComposition,
            columnType: it.columnType,
            flowRate: it.flowRate,
            wavelength: it.wavelength,
            expectedRetentionTime: it.expectedRetentionTime,
            notes: it.notes,
          })
        ),
        workspaceBookings:
          storeFormData.workspaceBookings?.map((w: WorkspaceBookingInput) => ({
            startDate: w.startDate ?? new Date(),
            endDate: w.endDate ?? new Date(),
            equipmentIds: w.equipmentIds ?? [],
            specialEquipment: w.specialEquipment,
            preferredTimeSlot: w.preferredTimeSlot,
            purpose: w.purpose,
            notes: w.notes,
            addOnIds: w.addOnIds ?? [],
          })) ?? [],
        projectDescription: storeFormData.projectDescription ?? "",
        additionalNotes: storeFormData.additionalNotes ?? "",
        payerType: storeFormData.payerType,
        billingName: storeFormData.billingName,
        billingAddressDisplay: storeFormData.billingAddressDisplay,
        billingPhone: storeFormData.billingPhone,
        billingEmail: storeFormData.billingEmail,
        utmCampus: storeFormData.utmCampus,
      };

      form.reset(normalized);
    }
  }, [form, storeFormData]);

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

    // Add to store
    addServiceToStore(service);

    // Each service item represents one sample or one workspace slot
    const isWorkingSpace = service.category === "working_space";
    const defaultItem: BookingServiceItemInput = {
      serviceId: service.id,
      quantity: isWorkingSpace ? 0 : 1,
      durationMonths: isWorkingSpace ? 1 : 0,
      sampleName: undefined,
      temperatureControlled: false,
      lightSensitive: false,
      hazardousMaterial: false,
      inertAtmosphere: false,
      equipmentIds: [],
      otherEquipmentRequests: [],
      addOnIds: [],
      ...(isWorkingSpace
        ? {
            expectedCompletionDate: new Date(),
            notes: `START_DATE:${new Date().toISOString()}||END_DATE:${new Date(
              Date.now() + 30 * 24 * 60 * 60 * 1000
            ).toISOString()}`,
          }
        : {}),
    };

    append(defaultItem);
  };

  const handleAddSample = (serviceId: string) => {
    let service = getService(serviceId);

    if (!service && initialServices.length > 0) {
      const found = initialServices.find(
        ({ service: s }) => s.id === serviceId
      );
      if (found) {
        service = found.service;
        addServiceToStore(service);
      }
    }

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

    if (!getService(serviceId)) {
      addServiceToStore(service);
    }

    const isWorkingSpace = service.category === "working_space";

    const defaultItem: BookingServiceItemInput = {
      serviceId: service.id,
      quantity: isWorkingSpace ? 0 : 1,
      durationMonths: isWorkingSpace ? 1 : 0,
      sampleName: undefined,
      temperatureControlled: false,
      lightSensitive: false,
      hazardousMaterial: false,
      inertAtmosphere: false,
      equipmentIds: [],
      otherEquipmentRequests: [],
      addOnIds: [],
      ...(isWorkingSpace
        ? {
            expectedCompletionDate: new Date(),
            notes: `START_DATE:${new Date().toISOString()}||END_DATE:${new Date(
              Date.now() + 30 * 24 * 60 * 60 * 1000
            ).toISOString()}`,
          }
        : {}),
    };

    append(defaultItem);
  };

  const handleRemoveService = (index: number) => {
    const field = fields[index];
    if (!field) return;

    const itemsForService = fields.filter(
      (f) => f.serviceId === field.serviceId
    );
    const isLastItem = itemsForService.length === 1;

    remove(index);

    if (isLastItem) {
      removeServiceFromStore(field.serviceId);
    }
  };

  const handleRemoveServiceGroup = (serviceId: string) => {
    const indicesToRemove = fields
      .map((field, index) => (field.serviceId === serviceId ? index : -1))
      .filter((index) => index !== -1)
      .sort((a, b) => b - a);

    indicesToRemove.forEach((index) => {
      remove(index);
    });

    removeServiceFromStore(serviceId);
  };

  const handleServiceUpdate = (
    index: number,
    data: Partial<BookingServiceItemInput>
  ) => {
    const field = fields[index];
    if (field) {
      updateServiceItemInStore(field.serviceId, data);
      const currentValues = form.getValues(`serviceItems.${index}`);
      update(index, {
        ...currentValues,
        ...data,
      });
    }
  };

  const handleSaveDraft = () => {
    const formData = form.getValues();
    setFormData(formData);
    sonnerToast.success("Draft saved", {
      description: "Your booking has been saved as a draft.",
    });
  };

  const onSubmit = async (data: CreateBookingInput): Promise<void> => {
    try {
      const result = await createBookingMutation.mutateAsync(data);
      clearDraft();
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
    return getService(serviceId);
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
