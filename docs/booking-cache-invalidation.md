# Booking API Cache Invalidation Strategy

## Overview

This document explains how TanStack Query cache invalidation is managed for booking-related data to ensure the UI always displays fresh data after mutations. The implementation follows **Feature-Sliced Design** (FSD) best practices.

## Architecture

### Entity-Level API (Single Source of Truth)

All booking-related TanStack Query hooks live in `/src/entities/booking/api/`:

- `use-bookings.ts` - Core CRUD operations (create, save, submit, delete)
- `use-bookings-list.ts` - **Primary API** for list view with pagination, filtering, and status counts
- `use-equipment.ts` - Equipment-related queries
- `index.ts` - Centralized exports for clean imports

### Following FSD Principles

Per [Feature-Sliced Design guide](https://feature-sliced.design/docs/guides/tech/with-react-query):

✅ **Query keys and factories in entity layer**  
✅ **Mutation hooks alongside query hooks**  
✅ **queryOptions for type safety**  
✅ **Centralized cache invalidation**  
✅ **No mixed concerns** - queries separate from mutations

### Centralized Cache Invalidation

The `invalidateAllBookingQueries()` function ensures all booking-related queries are invalidated after any mutation:

```typescript
export function invalidateAllBookingQueries(queryClient: ReturnType<typeof useQueryClient>) {
  // Invalidate all list keys (includes counts for all filters)
  queryClient.invalidateQueries({ queryKey: bookingsListKeys.root });
}
```

## Query Keys Structure

### Booking Keys (use-bookings.ts)
```typescript
bookingKeys = {
  all: ["bookings"],
  details: ["bookings", "detail"],
  detail: ["bookings", "detail", bookingId],
}
```

### List Keys (use-bookings-list.ts) - **Primary API**
```typescript
bookingsListKeys = {
  root: ["bookings-list"],
  list: ["bookings-list", { page, pageSize, sort, status, type, etc }],
  counts: ["bookings-counts", { createdFrom, createdTo, type }],
}
```

## Mutation Hooks with Auto-Invalidation

### 1. Create Draft
```typescript
useCreateBookingDraft()
```
**Invalidates**: All lists and counts
**Reason**: New booking added, affects "All" count and draft count

### 2. Save Draft
```typescript
useSaveBookingDraft()
```
**Invalidates**: 
- Specific booking detail
- All lists and counts (amounts may have changed)

### 3. Submit Booking
```typescript
useSubmitBooking()
```
**Invalidates**: All lists, counts, and specific booking detail
**Reason**: Status changed (draft → pending), affects multiple status counts

### 4. Delete Draft
```typescript
useDeleteBookingDraft()
```
**Invalidates**: All lists and counts
**Removes**: Specific booking from cache
**Reason**: Booking removed, affects counts

## Cache Strategy for Performance

### Status Counts Caching
Status counts are aggressively cached to prevent stuttering when switching filters:

```typescript
useBookingStatusCounts({
  staleTime: 5 * 60_000,        // 5 minutes - data is fresh
  cacheTime: 10 * 60_000,        // 10 minutes - keep in memory
  refetchOnWindowFocus: false,   // Don't refetch on focus
  refetchOnMount: false,         // Don't refetch if data exists
  keepPreviousData: true,        // Prevent loading flashes
})
```

### Prefetching Strategy

1. **On Mount**: Prefetch counts for all type filters (all, analysis_only, working_space)
2. **On Hover**: Prefetch list data for type badges before user clicks
3. **On Next Page Hover**: Prefetch next page data

## Usage Examples

### In Feature Components

```typescript
import {
  useDeleteBookingDraft,
  invalidateAllBookingQueries,
} from "@/entities/booking/api";

function BookingList() {
  const deleteMutation = useDeleteBookingDraft();
  const queryClient = useQueryClient();

  const handleDelete = async (id: string) => {
    await deleteMutation.mutateAsync(id);
    // Automatic invalidation happens in the mutation hook
  };

  // Manual refresh
  const handleRefresh = () => {
    invalidateAllBookingQueries(queryClient);
    toast.success("Refreshing data...");
  };
}
```

### Pagination Size Control

Users can now choose page size (10, 15, or 25 items):

```typescript
<Select
  onValueChange={(v) => setParams({ pageSize: Number(v) })}
  value={String(params.pageSize)}
>
  <SelectItem value="10">10 / page</SelectItem>
  <SelectItem value="15">15 / page</SelectItem>
  <SelectItem value="25">25 / page</SelectItem>
</Select>
```

### Adding New Mutations

When adding new booking mutations:

1. Create mutation function in entity API
2. Create useMutation hook
3. Call `invalidateAllBookingQueries(queryClient)` in `onSuccess`
4. Export from `index.ts`

```typescript
// In use-bookings.ts
export function useApproveBooking() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: approveBooking,
    onSuccess: (_data, bookingId) => {
      // Invalidate all because status changed
      invalidateAllBookingQueries(queryClient);
      // Also invalidate specific booking
      queryClient.invalidateQueries({
        queryKey: bookingKeys.detail(bookingId),
      });
    },
  });
}
```

## Benefits

✅ **Always Fresh Data**: UI automatically updates after any mutation  
✅ **No Manual Invalidation**: Developers don't need to remember to invalidate  
✅ **Performance**: Aggressive caching prevents unnecessary refetches  
✅ **Consistent UX**: No stutter when switching filters  
✅ **Type-Safe**: All hooks are strongly typed  
✅ **Centralized**: Single source of truth for all booking queries  
✅ **FSD Compliant**: Follows Feature-Sliced Design best practices  
✅ **User Control**: Refresh button for manual data updates  
✅ **Flexible Pagination**: User-selectable page sizes (10, 15, 25)

## FSD Compliance Checklist

✅ Query keys in entity layer (`/entities/booking/api/`)  
✅ Query factories with type-safe keys  
✅ Mutation hooks in entity layer  
✅ No legacy list APIs (removed `useUserBookings`)  
✅ Single source of truth (`useBookingsList` for lists)  
✅ Proper separation of concerns  
✅ Centralized invalidation strategy## Migration Guide

### Deprecated APIs

The following have been removed or deprecated:

```typescript
// ❌ REMOVED - Legacy list keys
bookingKeys.lists()
bookingKeys.list(filters)

// ❌ DEPRECATED - Use useBookingsList instead
useUserBookings(filters)

// ✅ USE THIS - Primary list API
useBookingsList(params)
```

### Before (Manual fetch + invalidation)
```typescript
const handleDelete = async (id: string) => {
  const res = await fetch(`/api/bookings/${id}`, { method: "DELETE" });
  if (res.ok) {
    await queryClient.invalidateQueries({ queryKey: bookingsListKeys.root });
  }
};
```

### After (Using mutation hook)
```typescript
const deleteMutation = useDeleteBookingDraft();

const handleDelete = async (id: string) => {
  await deleteMutation.mutateAsync(id);
  // Automatic invalidation + error handling
};
```

## Future Enhancements

1. **Optimistic Updates**: Update UI before server responds
2. **WebSocket Integration**: Real-time updates for admin actions
3. **Selective Invalidation**: Only invalidate affected queries
4. **Background Sync**: Sync data in background periodically
