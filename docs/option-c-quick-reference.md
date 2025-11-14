# Option C - Quick Reference Guide

## What Changed

### 1. New Booking Flow
**Before**: `/bookings/new/page.tsx` rendered a form page
**After**: `/bookings/new/route.ts` creates draft and redirects

```
User → /bookings/new → Creates draft → Redirects to /bookings/[id]/edit
```

### 2. useBookingForm Hook
**File**: `src/features/booking-form/lib/use-booking-form.ts`

**Removed**:
- Auto-create draft effect on mount

**Added**:
- `hasSavedStep1Ref` - Tracks if step 1 was saved
- Autosave interval (2 min) for step 1 only
- Exit guard (beforeunload) for unsaved step 1
- `discardDraftIfUnsaved()` - Deletes draft if step 1 not saved

**Modified**:
- `handleNext` - Marks step 1 as saved
- `handleSaveDraft` - Marks step 1 as saved

### 3. Wizard UI
**File**: `src/widgets/booking-wizard/ui/BookingWizardPage.tsx`

**Changed**:
- Title: "Create Booking" for edit mode
- Last saved: Shows time only (HH:MM)
- Cancel button: Smart dialog
  - Step 1 unsaved → "Save or discard?"
  - Otherwise → "Discard draft?"

## User Experience

### Creating a New Booking
1. Click "New Booking" anywhere in app
2. **Instantly** redirected to edit page with draft created
3. See title "Create Booking"
4. Add services on step 1
5. **Autosave every 2 minutes** if changes made
6. Click "Next" → saves and advances
7. Complete steps 2-4
8. Click "Submit Booking" → done!

### Canceling Without Saving
#### Scenario A: On Step 1, Haven't Saved Yet
1. Make changes
2. Click "Cancel"
3. Dialog: "Save or discard this draft?"
   - **Save & Exit**: Saves draft, goes to bookings list
   - **Discard**: Deletes draft, goes to bookings list

#### Scenario B: On Step 1, After Autosave/Next/Save
1. Make changes
2. Wait 2 min (autosave) OR click Next/Save
3. Click "Cancel"
4. Dialog: "Discard booking draft?" (normal discard)

#### Scenario C: On Steps 2-4
1. Make changes
2. Click "Cancel"
3. Dialog: "Discard booking draft?" (normal discard)

### Refreshing the Page
- Draft persists (saved to DB)
- Page reloads with current draft data
- No data loss

### Closing Tab/Browser
- If step 1 and not saved: Browser shows "Leave site?" warning
- If saved at least once: No warning

## Developer Notes

### When Draft is Created
- Server-side in `/bookings/new/route.ts`
- Before page renders
- Returns actual UUID bookingId

### When Draft is Saved
1. **Explicit**: User clicks "Save Draft" or "Next"
2. **Implicit**: Autosave every 2 minutes on step 1 (if dirty)
3. **Final**: On "Submit Booking" (full validation)

### When Draft is Deleted
1. **Explicit**: User clicks "Discard" in dialog
2. **Conditional**: User clicks "Discard" on step 1 without save
3. **Cleanup**: Cron job deletes 7-day-old drafts

### API Calls
```typescript
// Create (route handler only)
POST /api/bookings
→ { id, referenceNumber, status: "draft" }

// Save
PATCH /api/bookings/:id
Body: Partial<CreateBookingInput>
→ { lastSavedAt }

// Submit
POST /api/bookings/:id/submit
→ { id, status, message }

// Delete
DELETE /api/bookings/:id
→ 204 No Content
```

### Key Functions

#### Route Handler
```typescript
// src/app/(main)/bookings/new/route.ts
export async function GET() {
  const me = await requireCurrentUserApi();
  const result = await bookingService.createDraft({ userId: me.appUserId });
  return NextResponse.redirect(`/bookings/${result.bookingId}/edit`);
}
```

#### Autosave Effect
```typescript
// useBookingForm.ts
useEffect(() => {
  if (currentStep !== 1) return;
  const interval = setInterval(async () => {
    if (!form.formState.isDirty) return;
    await saveDraftMutation.mutateAsync({ bookingId, data });
    hasSavedStep1Ref.current = true;
  }, 120_000); // 2 minutes
  return () => clearInterval(interval);
}, [currentStep]);
```

#### Exit Guard
```typescript
// useBookingForm.ts
useEffect(() => {
  const handler = (e: BeforeUnloadEvent) => {
    if (currentStep === 1 && !hasSavedStep1Ref.current && form.formState.isDirty) {
      e.preventDefault();
      e.returnValue = "";
    }
  };
  window.addEventListener("beforeunload", handler);
  return () => window.removeEventListener("beforeunload", handler);
}, [currentStep, form.formState.isDirty]);
```

## Migration Notes

### For Existing Code
- No breaking changes to API contracts
- All existing pages continue to work
- Booking list, detail, admin pages unchanged

### For New Features
- Use `/bookings/new` route for "Create New" links
- Don't create `page.tsx` under `/bookings/new`
- All creation flows go through edit page now

### For Testing
- Test autosave by waiting 2+ minutes on step 1
- Test exit guard by making changes and clicking Cancel
- Test refresh behavior (data persists)
- Test "Continue Editing" button on draft bookings

## Troubleshooting

### "No booking draft" error
- Draft creation failed or bookingId missing
- Check: `/api/bookings` POST endpoint
- Check: `requireCurrentUserApi()` auth

### Autosave not working
- Check: Are you on step 1?
- Check: Is form dirty?
- Check: Is bookingId present?
- Check: Browser console for errors

### Exit guard not showing
- Check: Are you on step 1?
- Check: Did you already save (Next/Save/autosave)?
- Check: Is form dirty?

### Draft not deleted on "Discard"
- Check: API route DELETE `/api/bookings/:id`
- Check: `bookingService.deleteDraft()` logic
- Check: Ownership validation

## Performance Tips

1. **Reduce Autosave Frequency**
   - Increase interval from 120_000 to higher value
   - Trade-off: Less frequent saves = more potential data loss

2. **Disable Autosave**
   - Remove autosave effect entirely
   - Rely on explicit "Save Draft" only
   - Trade-off: Users must remember to save

3. **Add Visual Feedback**
   - Show spinner during autosave
   - Show "Saved" checkmark after success
   - Trade-off: More UI complexity

## Future Enhancements

1. **Optimistic Updates**
   - Update UI immediately before API call
   - Revert on failure

2. **Conflict Resolution**
   - Detect if draft changed elsewhere
   - Offer merge or override options

3. **Draft History**
   - Save snapshots of each autosave
   - Allow "undo" to previous state

4. **Telemetry**
   - Track autosave success rate
   - Track draft abandonment rate
   - Track time to completion

5. **Offline Support**
   - Cache draft changes locally
   - Sync when connection restored
