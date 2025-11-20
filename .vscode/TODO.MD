Revised Architecture Plan: Lab Operations Module + Conflict Safety

Guiding principles
- Use Feature-Sliced architecture: app → pages → features → entities → shared.
- TanStack Query usage is restricted to entities. Pages and features should consume entity hooks only.
- Reuse existing components, utilities, API/server actions where available (e.g., booking list table, filters, Admin layout, badges, calendar primitives).
- Keep complex UI modular; target <600 lines per file by splitting concerns (columns, cells, headers, adapters).
- Ensure design consistency by referencing the existing Booking List and its filter patterns.
- Remove any references to review_submitted; it is deprecated.

High-level overview
- Admin page: Operations dashboard with two tabs: Samples and Workspace.
- Samples tab: Operational list with inline status updates.
- Workspace tab: Read-only calendar + daily schedule.
- User dashboard: Lightweight sample status widget.
- Booking engine: Anti-Double-Booking validation for workspace items.

Architecture map (FSD-style)

1) Pages
- src/app/(main)/admin/operations/page.tsx
  - Server page using Admin layout.
  - Composes two feature sections: Sample Tracker and Workspace Overview.
  - Delegates all data fetching to entities via feature components.

- src/app/(main)/dashboard/page.tsx
  - Reuse existing dashboard layout.
  - Composes the UserSampleTracker widget from widgets/features.

2) Features
- features/operations
  - ui/OperationsTabs (tabs shell only)
  - ui/SampleTrackerSection (composes filters + table; no data logic)
  - ui/WorkspaceOverviewSection (composes calendar + daily schedule; no data logic)
  - model/constants (tab ids, copy, route paths)

- features/sample-status-update
  - model/mutation (mutations only; calls existing server action if available)
  - ui/StatusCell (inline Select cell; optimistic update and toasts; no queries)

- widgets/user-sample-tracker
  - ui/UserSampleTracker (small list for dashboard view; consumes entity query)
  - model/mappers (row/item adapters for widget)

3) Entities
- entities/sample-tracking
  - api/server (server action wrappers; reuse existing actions if present)
  - model/types (SampleStatus union without review_submitted)
  - model/query-keys
  - model/queries (TanStack hooks: get operations list, get current user samples)
  - lib/mappers (Prisma → UI row)
  - ui/StatusBadge (shared styling reused across admin/user)

- entities/workspace-booking
  - api/server (server action wrapper(s); reuse existing schedule/bookings APIs)
  - model/types (Booking event DTO for calendar, time slots)
  - model/query-keys
  - model/queries (month range schedule fetch; per-day selector)
  - lib/mappers (Prisma → calendar event)
  - ui/Legend/Badge (reuse shared where possible)

- entities/booking-request
  - model/types (statuses, mapping for approved/in_progress/completed)
  - lib/selectors (filters reused by workspace schedule)
  - Reuse existing where already implemented.

- entities/user, entities/service
  - Reuse existing models/types/selectors for display (name, userType badge, service name).

4) Shared
- shared/ui
  - DataTable (reuse from booking list)
  - Calendar primitives (reuse shadcn Calendar / react-day-picker wrapper)
  - Card, Tabs, Badge, Select (reuse)
  - Toast/Toaster config (reuse sonner integration)

- shared/config
  - status-maps (SampleStatus → label, color, semantic intent)
  - date formatting and range helpers (reuse existing date utils)

- shared/lib
  - date-range utils, overlap checks (reused in booking conflict logic)
  - type guards and result helpers
  - revalidate helpers (if centralized)

- shared/mappers
  - name formatting (User), service display, slot formatting

Domain and data contracts

SampleTracking
- Core fields consumed: id, sampleIdentifier, status, createdAt
- Required includes: BookingServiceItem → BookingRequest → User
- Display shape (row): sampleIdentifier, customerName, userType, serviceName, status, bookingId, createdAt

WorkspaceBooking
- Core fields consumed: id, startDate, endDate, timeSlot, purpose
- Required includes: BookingRequest (approved | in_progress | completed), User
- Calendar event: id, userName, startDate, endDate, timeSlot, purpose

Statuses
- Sample statuses allowed: pending, received, in_analysis, analysis_complete, returned
- review_submitted removed entirely
- analysis_complete should trigger revalidation of relevant paths (admin ops and dashboard)

Data access and server layer

Reuse-first strategy
- Prefer existing server actions/endpoints from booking list and workspace modules.
- Only add new actions if no equivalent exists. If creating, locate them near the entity (entities/*/api/server).

Server actions
- Sample operations list: fetch SampleTracking with includes; filter by status; sort oldest first; paginate if list may grow.
- Sample status update: update SampleTracking.status; if set to analysis_complete, trigger revalidate for admin ops route and user dashboard widgets.
- Workspace schedule: fetch WorkspaceBooking for a date range with parent BookingRequest in approved | in_progress | completed; flatten to calendar events.

Queries in entities
- entities/sample-tracking/model/queries
  - useSampleOperationsList(filters, pagination)
  - useUserActiveSamples(userId) excluding returned

- entities/workspace-booking/model/queries
  - useWorkspaceScheduleForRange(monthStart, monthEnd) with a normalization layer
  - Provide a selector util to get events for a selected date from cached range

Query keys
- Namespaced by entity and params to avoid collisions
- Stable across tabs and widgets to maximize cache reuse

Caching, revalidation, and consistency
- Revalidate paths on sample status transitions as above.
- Invalidate relevant query keys from mutation layer (features/sample-status-update) to keep lists and widget in sync.
- Consider month-scoped caching for the workspace schedule to minimize refetching.

UI composition and modularity

Admin Operations Page
- page.tsx: server component shell, sets up Tabs (Samples | Workspace), delegates to feature sections
- Keep page.tsx minimal; actual UI resides in features/operations/ui

Tab 1: Sample Tracker
- SampleTrackerSection
  - Header: reuse AdminPageHeader style
  - Filter Bar: reuse BookingList filter pattern/components; adjust config to sample statuses
  - Table: reuse shared DataTable; columns defined in a separate file
    - Columns split files:
      - columns.ts (definitions only)
      - cells/StatusCell.tsx (Select control; belongs to features/sample-status-update)
      - cells/CustomerCell.tsx (uses shared UserBadge)
      - cells/ServiceCell.tsx
      - cells/ActionsCell.tsx (link to /admin/bookings/[id])
  - Data source: useSampleOperationsList from entities/sample-tracking
  - Pagination: reuse DataTable pagination pattern

Tab 2: Workspace Overview
- WorkspaceOverviewSection
  - Left: Calendar (reuse shared/ui calendar). Month navigation updates the cached range via entity query.
  - Right: Daily Schedule Card
    - Title shows selected date
    - List entries: userName, purpose, timeSlot
    - Empty state message when none
  - Data source: useWorkspaceScheduleForRange; client-side filter by selected date using entity selector

User Dashboard: Sample Tracker Widget
- UserSampleTracker widget
  - Small list of active samples (exclude returned)
  - StatusBadge reused from entities/sample-tracking/ui
  - Consistent status colors with admin view

Booking Engine: Conflict Safety (User-specific)
- Location: submission flow under features/bookings (reuse existing submission action)
- Logic (no code):
  - If a booking includes a workspace item, query existing WorkspaceBooking for the current user where parent BookingRequest is pending_approval, approved, or in_progress (ignore rejected/cancelled)
  - Check overlap: newStart <= existingEnd AND newEnd >= existingStart
  - On conflict, throw a domain error with a clear message
- Reuse shared/lib date overlap helper and existing repository/query functions if present
- Indexing: ensure WorkspaceBooking has an index on userId + startDate + endDate for efficient overlap checks

Design and UX consistency
- Adopt styles from Booking List: filter chips, table density, badge sizes
- Status badge colors centralized in shared/config/status-maps
- Use existing UserBadge, Service label patterns
- Toasts: reuse global toasting config; success and error variants consistent

Performance and file-size budget
- Split table concerns (columns, cells, adapters) into small files
- Use adapters/mappers to flatten Prisma types into presentation shapes in entities/lib
- Calendar: prefetch month range; avoid per-day queries
- Lists: consider virtualization only if row counts are high; otherwise paginate

Error handling and access control
- Admin route guard: ensure only admins can access Operations
- Feature mutations: surface domain errors via toasts; keep UI responsive with optimistic update and rollback on error
- Fallbacks: show empty states and skeletons consistent with existing patterns

Testing and QA
- Unit: mappers, status maps, overlap logic
- Integration: entity queries and mutations (mock server actions)
- E2E: admin updates sample status, workspace calendar shows correct daily schedule, dashboard widget reflects updates
- Regression: ensure existing booking list behavior unaffected

Telemetry and logging (optional)
- Track status change events (admin) and schedule view interactions (date selections) following existing analytics conventions

Deprecations and cleanup
- Remove any lingering review_submitted references from enums, filters, and UI
- Align SampleStatus across server and client types

Planned file inventory (create/modify)

Pages
- src/app/(main)/admin/operations/page.tsx

Features
- src/features/operations/ui/OperationsTabs.tsx
- src/features/operations/ui/SampleTrackerSection.tsx
- src/features/operations/ui/WorkspaceOverviewSection.tsx
- src/features/operations/model/constants.ts
- src/features/sample-status-update/model/mutation.ts
- src/features/sample-status-update/ui/StatusCell.tsx
- src/widgets/user-sample-tracker/ui/UserSampleTracker.tsx
- src/widgets/user-sample-tracker/model/mappers.ts

Entities
- src/entities/sample-tracking/api/server.ts
- src/entities/sample-tracking/model/types.ts
- src/entities/sample-tracking/model/query-keys.ts
- src/entities/sample-tracking/model/queries.ts
- src/entities/sample-tracking/lib/mappers.ts
- src/entities/sample-tracking/ui/StatusBadge.tsx
- src/entities/workspace-booking/api/server.ts
- src/entities/workspace-booking/model/types.ts
- src/entities/workspace-booking/model/query-keys.ts
- src/entities/workspace-booking/model/queries.ts
- src/entities/workspace-booking/lib/mappers.ts
- src/entities/booking-request/model/types.ts (reuse/extend existing)
- src/entities/booking-request/lib/selectors.ts (reuse)
- src/entities/user (reuse existing)
- src/entities/service (reuse existing)

Shared
- src/shared/ui/DataTable (reuse)
- src/shared/ui/Calendar (reuse)
- src/shared/ui/Badge, Card, Tabs, Select (reuse)
- src/shared/config/status-maps.ts
- src/shared/lib/date.ts (reuse)
- src/shared/lib/overlap.ts (reuse or add if missing)

Backend integration and reuse notes
- If server actions for sample list/status or workspace schedule already exist, import and wrap them in entities’ api/server to avoid duplication.
- Keep Prisma includes consistent with existing booking list includes to maintain data shape alignment.
- Reuse existing filter models from booking list where possible; only extend for sample-specific needs.

Rollout order
1) Entities scaffolding (types, query keys, mappers) for sample-tracking and workspace-booking
2) Feature: Sample Tracker section wired to entity queries; StatusCell wired to mutation
3) Feature: Workspace Overview section wired to entity schedule queries and daily filtering
4) Widget: UserSampleTracker on dashboard
5) Booking engine conflict safety logic in submission flow
6) QA, accessibility checks, and consistency polish

Acceptance criteria
- Admin Operations page shows two tabs; page loads with existing admin layout
- Samples tab lists samples with filters and inline status updates; updates propagate to dashboard widget and list without manual refresh
- Workspace tab shows monthly calendar and accurate per-day schedule; read-only
- User dashboard displays active user samples with consistent badge colors
- Double-booking for workspace is prevented for the same user across overlapping dates
- No references to review_submitted remain anywhere in UI or logic

This plan prioritizes architectural boundaries, reusability, and consistency with your current codebase. It avoids re-implementing existing features and keeps TanStack Query confined to entities, with mutations encapsulated in features.