Below is a step-by-step Cursor plan you can paste into your agent. It’s organized as tasks with clear intents, file targets, and acceptance criteria. It refactors your booking form to make RHF the single source of field truth, uses Zod as the canonical schema, and limits Zustand to wizard/meta state. It also adds a draft service and logout clearing.

Plan: Refactor Booking Form to RHF-First with Zod and Minimal Zustand

Task 0: Create a feature branch
- Intent: Work in isolation.
- Steps:
  - Create branch: feat/booking-rhf-refactor
- Acceptance:
  - New branch checked out.

Task 1: Stabilize Zod schemas as single source of truth
- Intent: Ensure all validation/business rules are in Zod.
- Files:
  - src/entities/booking/model/schemas.ts
- Steps:
  - Review createBookingInputSchema. Add/refine:
    - serviceItems: per-category rules (e.g., working_space vs testing).
    - workspaceBookings: startDate < endDate, required fields.
    - Cross-field refinements: quantity > 0 when not working_space; durationMonths for working_space only, etc.
  - Export inferred types only from Zod: type CreateBookingInput = z.infer<typeof createBookingInputSchema>.
  - Add a helper schema for partial drafts (optional) if you want to validate partial drafts.
- Acceptance:
  - Zod schema fully validates your use cases. Unit tests for critical refinements pass.

Task 2: Add domain factories and normalizers
- Intent: Centralize default creation and normalization. No store access.
- Files:
  - src/entities/booking/lib/factories.ts (new)
- Steps:
  - Implement:
    - createDefaultServiceItem(service: Service, now = new Date()).
    - createDefaultWorkspaceBooking(now = new Date()).
    - normalizeServiceItem(i, service?) to coerce optional fields to defaults.
    - normalizeBookingInput(input) to produce stable defaultValues for RHF.
    - attachMetadataForValidation(input, services: Service[]) to enrich items with category if schema needs it.
- Acceptance:
  - Pure functions with unit tests covering working_space vs non-working_space defaults.

Task 3: Introduce a minimal wizard/meta Zustand store
- Intent: Remove field state from Zustand; keep only wizard/meta.
- Files:
  - src/entities/booking/model/use-booking-wizard-store.ts (new)
- Steps:
  - Create store with:
    - currentStep: number
    - isServiceDialogOpen: boolean
    - draftId?: string
    - lastSavedAt?: number
    - Actions: setCurrentStep, setServiceDialogOpen, setDraftId, markSaved, resetWizard, clearPersistAndRehydrate
  - Persist name: booking-wizard-meta
  - No formData/servicesMap in this store.
- Acceptance:
  - Store compiles and is used only for wizard/meta.

Task 4: Remove field state from the existing booking store
- Intent: Stop persisting fields and servicesMap in Zustand.
- Files:
  - src/entities/booking/model/use-booking-store.ts (existing)
- Steps:
  - Deprecate or delete this store. If other parts still reference, replace imports with use-booking-wizard-store.
  - If incremental migration is needed, keep the file but strip formData/servicesMap and related actions. Leave only wizard/meta (or entirely switch to Task 3 store).
- Acceptance:
  - No component references formData/servicesMap from Zustand.

Task 5: Implement local draft persistence service
- Intent: RHF-only drafts saved/restored explicitly.
- Files:
  - src/entities/booking/lib/draftService.ts (new)
- Steps:
  - Implement:
    - draftKey(userId, mode: "new" | "edit", bookingId?: string): string
    - getDraft<CreateBookingInput>(key): CreateBookingInput | null
    - saveDraft<CreateBookingInput>(key, data): void
    - clearDraft(key): void
  - Consider IndexedDB if draft size grows; start with localStorage.
- Acceptance:
  - Drafts can be saved, restored, and cleared with stable keys.

Task 6: BookingPage client integration and keying
- Intent: Ensure fresh RHF mount per user/mode/bookingId change.
- Files:
  - src/widgets/booking-page/index.tsx or wherever BookingPage client component resides
  - src/app/.../BookingRequestForm (server component) where you pass props
- Steps:
  - In the server component, compute userId, mode ("new" for now), bookingId (if edit).
  - Render BookingPage with key={`${userId}-${mode}-${bookingId ?? "new"}`}.
  - Pass services, equipment, profile, userType, userStatus as before.
- Acceptance:
  - Switching user or mode remounts BookingPage cleanly.

Task 7: Refactor useBookingForm to RHF-first
- Intent: Eliminate store mirroring; RHF is the only field truth.
- Files:
  - src/entities/booking/hooks/use-booking-form.ts (this hook)
- Steps:
  - Remove imports of formData/servicesMap from Zustand. Keep wizard store (currentStep, isServiceDialogOpen) if needed.
  - Build servicesMap from props (services) inside the hook or pass it from parent via useMemo.
  - Build defaultValues:
    - Start with normalizeBookingInput({})
    - If a draft exists (via draftService from parent), merge + normalize
    - If initialServices exist, append createDefaultServiceItem for each
    - Prefill billing fields from profile
  - Initialize RHF:
    - useForm({ defaultValues, resolver: zodResolver(createBookingInputSchema), mode: "onChange" })
  - useFieldArray for serviceItems and workspaceBookings as before.
  - Handlers:
    - handleAddService(service): append(createDefaultServiceItem(service))
    - handleAddSample(serviceId): find service; append default item; error if not found/pricing missing
    - handleServiceUpdate(index, data): update(index, merged)
    - handleRemoveService(index): remove; no Zustand interaction
    - handleAddWorkspace/remove/update: manipulate RHF arrays only
    - handleSaveDraft(draftKey): saveDraft(draftKey, form.getValues()); wizardStore.markSaved(Date.now())
    - onSubmit(data): optionally attachMetadataForValidation; parse with Zod (or rely on resolver); mutate; on success clearDraft and wizardStore.resetWizard; navigate
  - Delete sync useEffect that mirrored store -> form. No dual source of truth.
- Acceptance:
  - The hook has no references to formData/servicesMap in Zustand.
  - Compiles and basic flows work (add/update/remove, draft save, submit).

Task 8: BookingPage wiring for drafts and hydration
- Intent: Supply initial draft and key to hook.
- Files:
  - src/widgets/booking-page/index.tsx (client)
- Steps:
  - Compute draftKey from userId+mode+bookingId (passed down from server or via session client).
  - On mount, load initialDraft = getDraft(draftKey).
  - Pass services, equipment, profile, userType, userStatus, initialServices?, initialDraft, draftKey into useBookingForm.
  - Provide Save Draft button that calls handleSaveDraft(draftKey).
- Acceptance:
  - On reload, draft restores. On save, lastSavedAt updates in wizard store.

Task 9: Logout flow clears drafts and meta
- Intent: No stale data after logout, no hard reload needed.
- Files:
  - src/shared/ui/.../SignOutModal.tsx (your provided component)
- Steps:
  - Import booking wizard store and draftService.
  - Before signOut redirect:
    - await useBookingWizardStore.getState().clearPersistAndRehydrate()
    - If you can compute current draftKey(s), clearDraft(draftKey). Optionally sweep all keys starting with booking-draft:${userId} in localStorage.
  - Then call authClient.signOut(), then router.push("/").
- Acceptance:
  - After logout, visiting booking form shows clean state.

Task 10: Validation enhancement with Zod and metadata
- Intent: Ensure validation sees necessary metadata (e.g., service category).
- Files:
  - src/entities/booking/model/schemas.ts
  - src/entities/booking/lib/factories.ts
  - src/entities/booking/hooks/use-booking-form.ts
- Steps:
  - If schema requires category, add a pre-submit transform:
    - const enriched = attachMetadataForValidation(form.getValues(), services)
    - createBookingInputSchema.parse(enriched)
  - Alternatively, include a hidden field on each item for category and keep schema simpler.
- Acceptance:
  - Invalid combos produce friendly errors shown by RHF.

Task 11: Unit tests for schema and factories
- Intent: Prevent regressions.
- Files:
  - tests/entities/booking/schemas.test.ts
  - tests/entities/booking/factories.test.ts
- Steps:
  - Cover:
    - working_space item defaults and validations
    - testing item with quantity rules
    - workspace date range
    - normalizeBookingInput idempotency
  - CI green.
- Acceptance:
  - Tests pass locally and in CI.

Task 12: Performance and UX polish
- Intent: Smooth rendering and saving.
- Files:
  - src/widgets/booking-page/components/*
  - src/entities/booking/hooks/use-booking-form.ts
- Steps:
  - Use useMemo for servicesMap.
  - Use RHF’s useWatch selectively in subcomponents instead of reading entire form state.
  - Optional: Debounced autosave with useEffect + useWatch on relevant slices; disable when formState.isSubmitting; show “Saved at hh:mm” from wizardStore.lastSavedAt.
- Acceptance:
  - No noticeable jank; autosave works if enabled.

Task 13: Cleanup and migration notes
- Intent: Remove dead code and document changes.
- Steps:
  - Delete old use-booking-store.ts if fully superseded.
  - Update all imports to use use-booking-wizard-store and draftService where applicable.
  - Add a docs/booking-form-architecture.md explaining:
    - RHF as the only field state
    - Zod as single source of truth
    - Wizard store scope
    - Draft service usage and keys
    - Logout clearing
- Acceptance:
  - Repo free of unused store logic. Devs understand the new flow.

Code snippets to guide the agent

Wizard store
```ts
// src/entities/booking/model/use-booking-wizard-store.ts
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
    (set) => ({
      currentStep: 1,
      isServiceDialogOpen: false,
      draftId: undefined,
      lastSavedAt: undefined,
      setCurrentStep: (n) => set({ currentStep: n }),
      setServiceDialogOpen: (b) => set({ isServiceDialogOpen: b }),
      setDraftId: (id) => set({ draftId: id }),
      markSaved: (ts) => set({ lastSavedAt: ts }),
      resetWizard: () =>
        set({
          currentStep: 1,
          isServiceDialogOpen: false,
          draftId: undefined,
          lastSavedAt: undefined,
        }),
      clearPersistAndRehydrate: async () => {
        useBookingWizardStore.persist?.clearStorage?.();
        set({
          currentStep: 1,
          isServiceDialogOpen: false,
          draftId: undefined,
          lastSavedAt: undefined,
        });
        await useBookingWizardStore.persist?.rehydrate?.();
      },
    }),
    { name: "booking-wizard-meta" }
  )
);
```

Draft service
```ts
// src/entities/booking/lib/draftService.ts
const storage =
  typeof window !== "undefined" ? window.localStorage : undefined;

export function draftKey(
  userId: string,
  mode: "new" | "edit",
  bookingId?: string
) {
  return `booking-draft:${userId}:${mode}:${bookingId ?? "new"}`;
}

export function getDraft<T>(key: string): T | null {
  if (!storage) return null;
  const raw = storage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function saveDraft<T>(key: string, data: T) {
  if (!storage) return;
  storage.setItem(key, JSON.stringify(data));
}

export function clearDraft(key: string) {
  if (!storage) return;
  storage.removeItem(key);
}
```

Factories
```ts
// src/entities/booking/lib/factories.ts
import type { Service } from "@/entities/service";
import type {
  BookingServiceItemInput,
  CreateBookingInput,
  WorkspaceBookingInput,
} from "@/entities/booking/model/schemas";

export function createDefaultServiceItem(
  service: Service,
  now = new Date()
): BookingServiceItemInput {
  const isWorkingSpace = service.category === "working_space";
  return {
    serviceId: service.id,
    quantity: isWorkingSpace ? 0 : 1,
    durationMonths: isWorkingSpace ? 1 : 0,
    temperatureControlled: false,
    lightSensitive: false,
    hazardousMaterial: false,
    inertAtmosphere: false,
    equipmentIds: [],
    otherEquipmentRequests: [],
    addOnIds: [],
    ...(isWorkingSpace
      ? {
          expectedCompletionDate: now,
          notes: `START_DATE:${now.toISOString()}||END_DATE:${new Date(
            now.getTime() + 30 * 24 * 60 * 60 * 1000
          ).toISOString()}`,
        }
      : {}),
  };
}

export function createDefaultWorkspaceBooking(
  now = new Date()
): WorkspaceBookingInput {
  return {
    startDate: now,
    endDate: now,
    equipmentIds: [],
    addOnIds: [],
  };
}

export function normalizeBookingInput(
  input: Partial<CreateBookingInput>
): CreateBookingInput {
  return {
    serviceItems: (input.serviceItems ?? []).map((i) => ({
      serviceId: i.serviceId ?? "",
      quantity: i.quantity ?? 1,
      durationMonths: i.durationMonths ?? 0,
      temperatureControlled: i.temperatureControlled ?? false,
      lightSensitive: i.lightSensitive ?? false,
      hazardousMaterial: i.hazardousMaterial ?? false,
      inertAtmosphere: i.inertAtmosphere ?? false,
      equipmentIds: i.equipmentIds ?? [],
      otherEquipmentRequests: i.otherEquipmentRequests ?? [],
      addOnIds: i.addOnIds ?? [],
      sampleName: i.sampleName,
      sampleType: i.sampleType,
      sampleDetails: i.sampleDetails,
      testingMethod: i.testingMethod,
      samplePreparation: i.samplePreparation,
      expectedCompletionDate: i.expectedCompletionDate,
      actualCompletionDate: i.actualCompletionDate,
      turnaroundEstimate: i.turnaroundEstimate,
      sampleHazard: i.sampleHazard,
      degasConditions: i.degasConditions,
      solventSystem: i.solventSystem,
      solvents: i.solvents,
      solventComposition: i.solventComposition,
      columnType: i.columnType,
      flowRate: i.flowRate,
      wavelength: i.wavelength,
      expectedRetentionTime: i.expectedRetentionTime,
      notes: i.notes,
    })),
    workspaceBookings: (input.workspaceBookings ?? []).map((w) => ({
      startDate: w.startDate ?? new Date(),
      endDate: w.endDate ?? new Date(),
      equipmentIds: w.equipmentIds ?? [],
      specialEquipment: w.specialEquipment,
      preferredTimeSlot: w.preferredTimeSlot,
      purpose: w.purpose,
      notes: w.notes,
      addOnIds: w.addOnIds ?? [],
    })),
    projectDescription: input.projectDescription ?? "",
    additionalNotes: input.additionalNotes ?? "",
    payerType: input.payerType,
    billingName: input.billingName,
    billingAddressDisplay: input.billingAddressDisplay,
    billingPhone: input.billingPhone,
    billingEmail: input.billingEmail,
    utmCampus: input.utmCampus,
  };
}
```

Hook outline
```ts
// src/entities/booking/hooks/use-booking-form.ts
import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { createBookingInputSchema, type CreateBookingInput } from "@/entities/booking/model/schemas";
import type { Service, UserType } from "@/entities/service";
import { getServicePrice } from "@/entities/service";
import { createDefaultServiceItem, normalizeBookingInput } from "@/entities/booking/lib/factories";
import { saveDraft } from "@/entities/booking/lib/draftService";
import { useBookingWizardStore } from "@/entities/booking/model/use-booking-wizard-store";

export function useBookingForm({
  userType,
  userStatus,
  services,
  profile,
  initialDraft,
  initialServices = [],
  draftKey,
}: {
  userType: UserType;
  userStatus?: string;
  services: Service[];
  profile: { fullName?: string | null; email?: string | null };
  initialDraft?: Partial<CreateBookingInput> | null;
  initialServices?: Array<{ service: Service; item?: Partial<CreateBookingInput["serviceItems"][number]> }>;
  draftKey: string;
}) {
  const servicesMap = useMemo(
    () => new Map(services.map((s) => [s.id, s] as const)),
    [services]
  );

  const baseDefaults = normalizeBookingInput({});
  const draftDefaults = initialDraft ? normalizeBookingInput(initialDraft) : undefined;

  const seededServices = initialServices.map(({ service, item }) => ({
    ...createDefaultServiceItem(service),
    ...(item ?? {}),
  }));

  const defaultValues: CreateBookingInput = {
    ...baseDefaults,
    ...(draftDefaults ?? {}),
    serviceItems:
      (draftDefaults?.serviceItems && draftDefaults.serviceItems.length > 0)
        ? draftDefaults.serviceItems
        : seededServices,
    billingName: draftDefaults?.billingName ?? (profile.fullName ?? undefined),
    billingEmail: draftDefaults?.billingEmail ?? (profile.email ?? undefined),
  };

  const form = useForm<CreateBookingInput>({
    mode: "onChange",
    resolver: zodResolver(createBookingInputSchema),
    defaultValues,
  });

  const {
    fields,
    append,
    remove,
    update,
  } = useFieldArray({ control: form.control, name: "serviceItems", keyName: "id" });

  const {
    fields: workspaceFields,
    append: appendWorkspace,
    remove: removeWorkspace,
    update: updateWorkspace,
  } = useFieldArray({ control: form.control, name: "workspaceBookings", keyName: "id" });

  const isBlocked =
    userStatus === "pending" || userStatus === "inactive" || userStatus === "rejected";

  function handleAddService(service: Service) {
    const pricing = getServicePrice(service, userType);
    if (!pricing) {
      // show toast externally
      return;
    }
    append(createDefaultServiceItem(service));
  }

  function handleAddSample(serviceId: string) {
    const service = servicesMap.get(serviceId);
    if (!service) return;
    const pricing = getServicePrice(service, userType);
    if (!pricing) return;
    append(createDefaultServiceItem(service));
  }

  function handleServiceUpdate(index: number, data: Partial<CreateBookingInput["serviceItems"][number]>) {
    const current = form.getValues(`serviceItems.${index}`);
    update(index, { ...current, ...data });
  }

  function handleRemoveService(index: number) {
    remove(index);
  }

  function handleSaveDraft() {
    const data = form.getValues();
    saveDraft<CreateBookingInput>(draftKey, data);
    useBookingWizardStore.getState().markSaved(Date.now());
  }

  async function onSubmit(data: CreateBookingInput) {
    // optionally enrich with category and parse again here
    // await createBookingMutation.mutateAsync(data);
    // clearDraft(draftKey); useBookingWizardStore.getState().resetWizard();
  }

  return {
    form,
    fields,
    workspaceFields,
    isBlocked,
    handleAddService,
    handleAddSample,
    handleRemoveService,
    handleServiceUpdate,
    handleSaveDraft,
    onSubmit,
  };
}
```

Logout integration
- In SignOutModal effect before redirect:
  - await useBookingWizardStore.getState().clearPersistAndRehydrate()
  - clearDraft for the active draftKey(s) if available

Acceptance Summary
- RHF is the only field state holder.
- Zod schema acts as single source of truth; all validation encoded there.
- Zustand persists only wizard/meta; no form data leakage after logout.
- Drafts are explicit and keyed by userId+mode+bookingId, saved/restored via draftService.
- Booking form mounts cleanly per user/mode/bookingId due to component keys.