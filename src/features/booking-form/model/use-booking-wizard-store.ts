/**
 * Zustand store for booking wizard/meta state only
 * No form data or services - those live in RHF
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

type WizardState = {
  currentStep: number;
  isServiceDialogOpen: boolean;
  draftId?: string;
  lastSavedAt?: number;
  setCurrentStep: (n: number) => void;
  setServiceDialogOpen: (b: boolean) => void;
  setDraftId: (id?: string) => void;
  markSaved: (ts: number) => void;
  resetWizard: () => void;
  clearPersistAndRehydrate: () => Promise<void>;
};

export const useBookingWizardStore = create<WizardState>()(
  persist(
    (set, get) => ({
      currentStep: 1,
      isServiceDialogOpen: false,
      draftId: undefined,
      lastSavedAt: undefined,

      setCurrentStep: (n: number) => {
        set({ currentStep: n });
      },

      setServiceDialogOpen: (b: boolean) => {
        set({ isServiceDialogOpen: b });
      },

      setDraftId: (id?: string) => {
        set({ draftId: id });
      },

      markSaved: (ts: number) => {
        set({ lastSavedAt: ts });
      },

      resetWizard: () => {
        set({
          currentStep: 1,
          isServiceDialogOpen: false,
          draftId: undefined,
          lastSavedAt: undefined,
        });
      },

      clearPersistAndRehydrate: async () => {
        // Clear the persisted state
        set({
          currentStep: 1,
          isServiceDialogOpen: false,
          draftId: undefined,
          lastSavedAt: undefined,
        });

        // Clear from storage
        if (typeof window !== "undefined") {
          window.localStorage.removeItem("booking-wizard-meta");
        }

        // Force rehydration by resetting the store
        const state = get();
        set({ ...state });
      },
    }),
    {
      name: "booking-wizard-meta",
      partialize: (state) => ({
        currentStep: state.currentStep,
        draftId: state.draftId,
        lastSavedAt: state.lastSavedAt,
        // Don't persist UI state like dialog open
      }),
    }
  )
);
