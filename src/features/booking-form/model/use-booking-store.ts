/**
 * DEPRECATED: This store is being phased out in favor of RHF-first architecture
 *
 * Zustand store for booking form state management
 *
 * @deprecated Use useBookingWizardStore for wizard/meta state only.
 * Form data should live in React Hook Form, not in Zustand.
 * This store is kept temporarily for backward compatibility with ServicesPage.
 *
 * Migration path:
 * - ServicesPage should be updated to navigate with service ID in URL params
 * - BookingPage should load service from params and add to RHF directly
 * - Once ServicesPage is updated, this file can be deleted
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CreateBookingInput } from "@/entities/booking/model/schemas";
import type { Service } from "@/entities/service";

type ServiceItem = NonNullable<CreateBookingInput["serviceItems"]>[number];

interface BookingStore {
  // Form data
  formData: Partial<CreateBookingInput>;
  // Service map for quick lookup
  servicesMap: Map<string, Service>;
  // Current step
  currentStep: number;
  // Last draft save timestamp
  lastSavedAt?: number;
  // UI state
  isServiceDialogOpen: boolean;

  // Actions
  setFormData: (data: Partial<CreateBookingInput>) => void;
  addService: (service: Service) => void;
  removeService: (serviceId: string) => void;
  updateServiceItem: (serviceId: string, data: Partial<ServiceItem>) => void;
  setCurrentStep: (step: number) => void;
  setServiceDialogOpen: (open: boolean) => void;
  clearDraft: () => void;
  getService: (serviceId: string) => Service | undefined;
  getServiceItems: () => CreateBookingInput["serviceItems"];
  commitStepDraft: (data?: Partial<CreateBookingInput>) => void;
}

const initialFormData: Partial<CreateBookingInput> = {
  serviceItems: [],
  projectDescription: "",
  additionalNotes: "",
  payerType: undefined,
  billingName: undefined,
  billingAddressDisplay: undefined,
  billingPhone: undefined,
  billingEmail: undefined,
  utmCampus: undefined,
};

export const useBookingStore = create<BookingStore>()(
  persist(
    (set, get) => ({
      formData: initialFormData,
      servicesMap: new Map(),
      currentStep: 1,
      isServiceDialogOpen: false,
      lastSavedAt: undefined,

      setFormData: (data) => {
        set((state) => ({
          formData: { ...state.formData, ...data },
        }));
      },

      addService: (service) => {
        set((state) => {
          const servicesMap = new Map(state.servicesMap);
          servicesMap.set(service.id, service);

          const existingItems = state.formData.serviceItems || [];
          const isWorkingSpace = service.category === "working_space";

          const newItem: ServiceItem = {
            serviceId: service.id,
            quantity: isWorkingSpace ? 0 : 1,
            durationMonths: isWorkingSpace ? 1 : 0,
            temperatureControlled: false,
            lightSensitive: false,
            hazardousMaterial: false,
            inertAtmosphere: false,
            equipmentIds: [],
            otherEquipmentRequests: undefined,
          };

          return {
            servicesMap,
            formData: {
              ...state.formData,
              serviceItems: [...existingItems, newItem],
            },
          };
        });
      },

      removeService: (serviceId) => {
        set((state) => {
          const servicesMap = new Map(state.servicesMap);
          servicesMap.delete(serviceId);

          const serviceItems =
            state.formData.serviceItems?.filter(
              (item: ServiceItem) => item.serviceId !== serviceId
            ) || [];

          return {
            servicesMap,
            formData: {
              ...state.formData,
              serviceItems,
            },
          };
        });
      },

      updateServiceItem: (serviceId, data) => {
        set((state) => {
          const serviceItems =
            state.formData.serviceItems?.map((item: ServiceItem) =>
              item.serviceId === serviceId ? { ...item, ...data } : item
            ) || [];

          return {
            formData: {
              ...state.formData,
              serviceItems,
            },
          };
        });
      },

      setCurrentStep: (step) => {
        set({ currentStep: step });
      },

      setServiceDialogOpen: (open) => {
        set({ isServiceDialogOpen: open });
      },

      clearDraft: () => {
        set({
          formData: initialFormData,
          servicesMap: new Map(),
          currentStep: 1,
          lastSavedAt: undefined,
        });
      },

      getService: (serviceId) => {
        return get().servicesMap.get(serviceId);
      },

      getServiceItems: () => {
        return get().formData.serviceItems || [];
      },

      commitStepDraft: (data) => {
        const nextFormData = data ?? get().formData;
        set({
          lastSavedAt: Date.now(),
          formData: { ...nextFormData },
          currentStep: get().currentStep,
        });
      },
    }),
    {
      name: "booking-draft-storage",
      partialize: (state) => ({
        formData: state.formData,
        servicesMap: Array.from(state.servicesMap.entries()),
        currentStep: state.currentStep,
        lastSavedAt: state.lastSavedAt,
      }),
      // Custom serialization for Map
      storage: {
        getItem: (name) => {
          if (typeof window === "undefined") return null;
          const str = localStorage.getItem(name);
          if (!str) return null;
          try {
            const parsed = JSON.parse(str);
            if (
              parsed.state?.servicesMap &&
              Array.isArray(parsed.state.servicesMap)
            ) {
              parsed.state.servicesMap = new Map(parsed.state.servicesMap);
            }
            return parsed;
          } catch {
            return null;
          }
        },
        setItem: (name, value) => {
          if (typeof window === "undefined") return;
          try {
            const toStore = {
              ...value,
              state: {
                ...value.state,
                servicesMap: Array.from(
                  value.state.servicesMap instanceof Map
                    ? value.state.servicesMap.entries()
                    : []
                ),
                currentStep: value.state.currentStep,
                lastSavedAt: value.state.lastSavedAt,
              },
            };
            localStorage.setItem(name, JSON.stringify(toStore));
          } catch {
            // Ignore storage errors
          }
        },
        removeItem: (name) => {
          if (typeof window === "undefined") return;
          localStorage.removeItem(name);
        },
      },
    }
  )
);
