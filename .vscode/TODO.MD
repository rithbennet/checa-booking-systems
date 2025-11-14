Here’s a focused Cursor plan just for wiring the full booking flow (forms + pages) to the new API. We’ll leave sample tracking as a thin scaffold at the end of the detail page and not go deep into that logic yet.

---

## High-Level Goals

- Use a single booking wizard (RHF + Zod) for:
  - `/bookings/new` (create draft + fill form)
  - `/bookings/[id]/edit` (edit existing draft)
- Persist progress to backend via:
  - Start: `POST /api/bookings`
  - Save/Next: `PATCH /api/bookings/:id`
  - Submit: `POST /api/bookings/:id/submit`
  - Discard: `DELETE /api/bookings/:id`
- Provide:
  - `/bookings` – user’s booking list.
  - `/bookings/[id]` – booking detail/progress view (with stub for sample tracking).
- Use existing Shadcn components from `shared/ui`.
- Show validation errors per step and a toast on every successful “Next” / Save.

---

## Task 0 – Branch and Pre-check

- Create branch `feat/booking-ui-wiring`.
- Ensure:
  - Booking API endpoints are implemented and reachable:
    - `POST /api/bookings`
    - `PATCH /api/bookings/:id`
    - `POST /api/bookings/:id/submit`
    - `DELETE /api/bookings/:id`
- Confirm `createBookingInputSchema` exists and is used with `zodResolver`.

**Acceptance:**

- Branch created.
- API endpoints respond (even with stubbed logic).

---

## Task 1 – Booking API React hooks

**Intent:** Wrap the REST endpoints in TS-safe hooks (preferably TanStack Query if already used elsewhere).

**Files:**

- `src/entities/booking/api/use-booking-requests.ts` (new)

**Steps:**

1. Create a small API client module with functions:
   - `createBookingDraft(): Promise<{ bookingId: string; referenceNumber: string }>`
   - `saveBookingDraft(bookingId, payload): Promise<{ lastSavedAt: string }>`
   - `submitBooking(bookingId, payload?): Promise<{ bookingId: string; status: booking_status_enum }>`
   - `deleteBookingDraft(bookingId): Promise<void>`
   - `getBookingById(bookingId): Promise<BookingWithItems>` (for edit + detail)
   - `getUserBookings(): Promise<UserBookingListItem[]>` (for `/bookings`)

2. Wrap them in React Query hooks if you are using it:
   - `useCreateBookingDraft`
   - `useSaveBookingDraft`
   - `useSubmitBooking`
   - `useDeleteBookingDraft`
   - `useBookingQuery(bookingId)`
   - `useUserBookingsQuery()`

3. Ensure proper error typing and throw on non-2xx.

**Acceptance:**

- Hooks compile.
- Basic manual usage (e.g., in a sandbox component) works.

---

## Task 2 – Mapping DB booking → form defaults (edit mode)

**Intent:** Map Prisma `BookingRequest` + children into `CreateBookingInput` for RHF.

**Files:**

- `src/entities/booking/lib/booking-mappers.ts` (new)
- You already have `CreateBookingInput` type and schema.

**Steps:**

1. Implement `mapBookingToCreateBookingInput(dbBooking: BookingRequest & { serviceItems, workspaceBookings, serviceAddOns }) => CreateBookingInput`.
   - For each `BookingServiceItem`:
     - Map scalar fields to the RHF structure.
     - Map equipment/add-ons as needed.
   - For each `WorkspaceBooking`:
     - Map dates, equipment, notes.
   - Map top-level fields:
     - `projectDescription`, `notes` → your form fields (projectDescription/additionalNotes/etc).
   - Ensure all optional fields are defaulted (align with your `normalizeBookingInput` logic).

2. Unit test with a sample `BookingRequest` fixture (optional but recommended).

**Acceptance:**

- Helper compiles and returns a shape assignable to `CreateBookingInput`.
- No runtime errors when used in a simple test component.

---

## Task 3 – BookingWizardPage (client component)

**Intent:** Single wizard component used by both `/bookings/new` and `/bookings/[id]/edit`.

**Files:**

- `src/widgets/booking-wizard/page.tsx` (or similar)
- Uses Shadcn components from `shared/ui/shadcn/*`

**Props:**

```ts
type BookingMode = "new" | "edit";

type BookingWizardPageProps = {
  mode: BookingMode;
  bookingId?: string;
  initialData?: CreateBookingInput;
  services: Service[];
  equipment: LabEquipment[];
  profile: BookingProfile;
  userType: UserType;
  userStatus?: user_status_enum;
};
```

**Steps:**

1. Mark as `"use client"` component.
2. Inside, call `useBookingForm({ mode, bookingId, initialData, services, profile, userType, userStatus })`.
3. Render:
   - Stepper/progress UI (Shadcn Tabs/Steps).
   - Step contents using your existing step components (if you already have them).
   - Navigation buttons:
     - Back
     - Next (or Save & Next)
     - Save Draft (optional)
     - Submit
     - Discard (if draft)
4. Buttons call handlers from `useBookingForm` (to be implemented in next task).
5. Show lastSavedAt if available.

**Acceptance:**

- Component compiles and can be mounted with mock props.
- No direct API calls here; only via `useBookingForm`.

---

## Task 4 – Refactor useBookingForm to use API + mode

**Intent:** Make `useBookingForm` the central place that:

- Initializes bookingId for new bookings.
- Sets RHF with Zod validation and step-level validation.
- Calls **create**, **save**, **submit**, **discard** endpoints.
- Shows toasts on success.

**Files:**

- `src/features/booking-form/use-booking-form.ts` (or wherever it is)

**Steps:**

1. Update signature:

```ts
export function useBookingForm({
  mode,
  bookingId: bookingIdProp,
  initialData,
  services,
  profile,
  userType,
  userStatus,
}: BookingWizardPageProps) {
  // ...
}
```

2. Local state:

   - `const [bookingId, setBookingId] = useState(bookingIdProp);`
   - Use `useCreateBookingDraft` hook:
     - On mount in `mode === "new"` and no `bookingId`, call `createBookingDraft` and setBookingId.
   - For `mode === "edit"`, `bookingId` is passed and never changed.

3. RHF initialization:

   - `useForm<CreateBookingInput>({ defaultValues, resolver: zodResolver(createBookingInputSchema), mode: "onChange" })`.
   - `defaultValues`:
     - If `initialData` exists, use it.
     - Else base on profile + empty arrays (using your `normalizeBookingInput` and default factories).

4. Step-level validation:

   - Define `STEP_FIELDS` map as described earlier.
   - `handleNext`:
     - Determine fields for currentStep.
     - `const valid = await form.trigger(stepFields);`
     - If not valid → show errors and abort.
     - If valid:
       - Call `saveBookingDraft` using React Query or fetch:
         - `saveBookingDraft(bookingId, { step: currentStep, data: form.getValues() })`
       - On success:
         - `toast.success("Draft saved", { description: "Step saved successfully." });`
         - `setCurrentStep(currentStep + 1)` (probably stored in wizard store).

5. `handleSaveDraft`:

   - Same PATCH call, but don’t increment step.
   - Show toast “Draft saved”.

6. `handleSubmit`:

   - `await form.trigger()` for full validation.
   - If valid:
     - Option A: call `submitBooking(bookingId)` (server uses DB).
     - Option B: `submitBooking(bookingId, { data: form.getValues() })`.
   - On success:
     - Show toast based on returned status:
       - `pending_user_verification`: “Submitted. Your account needs verification.”
       - `pending_approval`: “Submitted. Pending admin approval.”
     - Redirect to `/bookings/${bookingId}`.

7. `handleDiscard`:

   - Confirm using a Shadcn `AlertDialog` or similar.
   - Call `deleteBookingDraft`.
   - On success:
     - `toast.success("Draft discarded");`
     - Redirect to `/bookings`.

8. Keep existing handlers for adding/removing service items/workspaces; they now operate only on RHF state and then get persisted via PATCH.

**Acceptance:**

- `useBookingForm` compiles.
- In Storybook or a simple page, clicking Next triggers PATCH and success toast.

---

## Task 5 – `/bookings/new` page

**Intent:** Server page that loads initial data and renders the wizard in `mode="new"`.

**File:**

- `src/app/bookings/new/page.tsx`

**Steps:**

1. Server component:

   - `const session = await auth();`
   - Fetch:
     - `services` via existing API (`getServices({ filters: { userType } })`).
     - `equipment` (`getAvailableEquipment()`).
     - Profile (as you showed in earlier code: get invoice payer profile etc.).
   - Derive:
     - `userType` from `User.userType`.
     - `userStatus` from `User.status`.

2. Render:

```tsx
<BookingWizardPage
  mode="new"
  services={services}
  equipment={equipment}
  profile={profile}
  userType={userType}
  userStatus={userStatus}
/>
```

**Acceptance:**

- Navigating to `/bookings/new` shows an empty wizard.
- On load, `useBookingForm` calls `POST /api/bookings` to create a draft and sets bookingId.

---

## Task 6 – `/bookings/[id]/edit` page

**Intent:** Edit an existing draft booking using the same wizard UI.

**File:**

- `src/app/bookings/[id]/edit/page.tsx`

**Steps:**

1. Server component:

   - Get `id` from params.
   - `const session = await auth();`
   - Fetch booking via Prisma or a server-side service:
     - Only if `booking.userId === session.user.id`.
     - If not found → 404.
     - If `booking.status !== "draft"` → redirect to `/bookings/${id}` (view-only).
   - Fetch `services`, `equipment`, and `profile` as in `/bookings/new`.
   - Map booking to form data:

     ```ts
     const initialData = mapBookingToCreateBookingInput(bookingWithItems);
     ```

2. Render:

```tsx
<BookingWizardPage
  mode="edit"
  bookingId={id}
  initialData={initialData}
  services={services}
  equipment={equipment}
  profile={profile}
  userType={userType}
  userStatus={userStatus}
/>
```

**Acceptance:**

- `/bookings/edit/:id` loads with the form prefilled.
- Saving and submitting go through PATCH/submit APIs.

---

## Task 7 – `/bookings/[id]` detail / progress page

**Intent:** Show booking summary and per-service/per-workspace info, with a small stub for sample tracking (to be expanded later).

**File:**

- `src/app/bookings/[id]/page.tsx`

**Steps:**

1. Server component:

   - Get `id` and session.
   - Fetch booking:

     ```ts
     const booking = await prisma.bookingRequest.findFirst({
       where: { id, userId: session.user.id },
       include: {
         serviceItems: {
           include: {
             service: true,
             sampleTracking: true,
           },
         },
         workspaceBookings: {
           include: {
             equipmentUsages: { include: { equipment: true } },
           },
         },
       },
     });
     ```

   - If not found → 404.

2. Use Shadcn layout:

   - Top card with:
     - Ref #, booking status (badge), totalAmount, createdAt.
   - If status = rejected:
     - Red alert with `reviewNotes`, `reviewedByUser`, `reviewedAt`.
   - Info banner if status = pending_user_verification.

3. Services section:

   - Shadcn `Card` + `Table`:
     - Columns: Service name, quantity, total price, derived item status.
     - For item status, use `deriveItemStatus(booking.serviceItems[i].sampleTracking)` helper (just built).
   - This is the “thin scaffold” for sample tracking: show a small status pill per item, no detail timeline yet.

4. Workspace section:

   - Card listing workspace bookings:
     - Date range, equipment list, notes.
     - Optional derived label: upcoming/active/ended (based on today).

5. Draft-specific actions:

   - If `booking.status === "draft"`:
     - Show a button: “Continue Editing” linking to `/bookings/edit/${id}`.

**Acceptance:**

- `/bookings/:id` shows a read-only summary.
- Per service item, a simple status pill based on sample tracking (or “pending” if none).
- No editing from this page.

---

## Task 8 – `/bookings` list page for user

**Intent:** Show all bookings for the current user with statuses and quick actions.

**File:**

- `src/app/bookings/page.tsx`

**Steps:**

1. Server component:

   - Fetch:

     ```ts
     const bookings = await prisma.bookingRequest.findMany({
       where: { userId: session.user.id },
       orderBy: { createdAt: "desc" },
       select: {
         id: true,
         referenceNumber: true,
         status: true,
         totalAmount: true,
         createdAt: true,
       },
     });
     ```

2. Use Shadcn `Table` or `DataTable`:

   - Columns:
     - Reference #
     - Status badge
     - Total amount
     - Created at
     - Actions:
       - View → `/bookings/[id]`
       - If status = draft → Edit → `/bookings/[id]/edit`

3. For consistency, use existing button and badge components from `shared/ui/shadcn`.

**Acceptance:**

- `/bookings` shows list of user bookings.
- Clicking “View” opens detail page.
- Drafts also show “Edit” button.

---

## Task 9 – Validation and toasts (polish)

**Intent:** Ensure good UX feedback on all critical actions.

**Files:**

- `useBookingForm.tsx`
- Toast config (already using sonner).

**Steps:**

1. Step validation:

   - `handleNext`:
     - `const valid = await form.trigger(stepFields);`
     - If !valid: do not call API, scroll to first error (optional).

2. Toasts:

   - On successful `saveBookingDraft` (Next or Save):
     - `toast.success("Draft saved", { description: "Your changes have been saved." });`
   - On submit success:
     - Message varies by returned status.
   - On delete:
     - “Draft discarded”.
   - On any API failure:
     - `toast.error("Something went wrong", { description: errorMessage });`

**Acceptance:**

- On Next/Save with valid data:
  - API is called.
  - Toast shows “Draft saved”.
- On validation failure:
  - No API call.
  - RHF shows field-level errors.

---

## Task 10 – Quick smoke tests

**Intent:** Verify main scenarios manually.

**Scenarios:**

1. New booking:
   - `/bookings/new` → fill basic data → Next → See toast.
   - Refresh page → data still present (because saved server-side).
   - Submit:
     - If user.status active → goes to `/bookings/[id]` with status `pending_approval`.
     - If not active → shows `pending_user_verification`.

2. Edit booking:
   - Create draft, leave wizard.
   - `/bookings` → click Edit for that draft → see prefilled data.

3. Detail view:
   - `/bookings/[id]` shows summary and per-item status.
   - Draft booking has a “Continue Editing” button.

4. Discard:
   - From new or edit mode, Discard → Booking disappears from `/bookings`.

---

This plan wires the entire booking flow to the backend using your new APIs, reuses a single wizard for new/edit, adds list and detail pages using Shadcn UI, includes validation + toasts, and sets up a minimal scaffold for per-item/sample status without fully implementing sample tracking logic yet.

Once this is in, we can create a separate Cursor plan just for the deeper sample tracking UI and more advanced per-service timelines.