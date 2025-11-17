Here’s the streamlined, schema-aligned optimization plan for the User Booking List and Dashboard Widget. It removes non-existent concepts (e.g., invoice-based filters), uses only fields/enums present in your Prisma schema, relies on your existing APIs (DELETE /api/bookings/{id}, edit via existing form), and updates UI choices (Lucide icons + tooltips).

Scope and goals
- Minimize DB queries and API chatter.
- Keep filters strictly to what exists in schema.
- Use cached status chips; refetch only when data changes.
- Use Lucide icons for actions and status indicators with tooltips.

Data model reality (from schema)
- Booking status enum: draft, pending_user_verification, pending_approval, approved, rejected, in_progress, completed, cancelled
- Dates: createdAt, updatedAt, preferredStartDate/EndDate
- Amount: totalAmount
- Type filter derivable via relations:
  - working_space: workspaceBookings some {}
  - analysis_only: serviceItems some {} AND workspaceBookings none {}
- Reference: referenceNumber
- Project: projectDescription

Optimization plan

A) Queries and caching
- Main list request budget: 2 queries
  - Query A (rows): bookingRequest.findMany({ where, orderBy, select, take, skip })
  - Query B (total): bookingRequest.count({ where })
- Status chips: 1 grouped query (optional, cached)
  - bookingRequest.groupBy({ by: ['status'], where, _count: { _all: true } })
  - Key excludes pagination/sort; include only filters that are intended to affect counts (e.g., q, date range, type). If chips should be global, key by userId only.
- Remove OFFSET from all COUNT operations.
- Stop repeated user lookups: get userId from session once per API call and use it in where.
- Debounce q by 300 ms to prevent request storms.
- TanStack Query: set staleTime for statusCounts to 30–60s; refetchOnWindowFocus false; dedupe requests via consistent query keys.

B) Filters, sorts, URL params (only existing fields)
- URL params to persist:
  - page (default 1), pageSize (default 25)
  - sort: one of updated_at:desc (default), updated_at:asc, created_at:desc, created_at:asc, status:asc, amount:desc, amount:asc
  - q: searches referenceNumber and projectDescription
  - status[]: any of the booking_status_enum values
  - createdFrom, createdTo: YYYY-MM-DD (maps to createdAt)
  - type: all | analysis_only | working_space
- No invoice/due-date filters or statuses; not in schema.

C) WHERE and ORDER BY (shared between rows and counts)
- where base: { userId: currentUserId }
- status: include if status[].length > 0, else omit
- createdAt range: if provided
- q: OR on referenceNumber ILIKE and projectDescription ILIKE
- type:
  - working_space: { workspaceBookings: { some: {} } }
  - analysis_only: { AND: [{ serviceItems: { some: {} } }, { workspaceBookings: { none: {} } }] }
  - all: omit these clauses
- orderBy map:
  - updated_at -> { updatedAt: direction }
  - created_at -> { createdAt: direction }
  - status -> { status: direction }
  - amount -> { totalAmount: direction }

D) Columns and indicators (aligned to schema)
- Reference (copyable): referenceNumber
- Project: projectDescription
- Status: booking_status_enum badge; tooltip with lifecycle explanation
- Amount: totalAmount (hide for non-Active users → show “—” tooltip “Visible after verification”)
- Created: createdAt
- Optional indicator flags:
  - Has working space: derived via workspaceBookings some {}; show briefcase or building icon
  - In-progress/completed markers: based on status; simple icon color
- Remove invoice/overdue-related indicators.

E) Actions (use existing APIs; Lucide icons + tooltips)
- Draft row:
  - View (Eye)
  - Edit (Pencil) → navigate to existing edit form
  - Delete (Trash) → uses existing DELETE /api/bookings/{id} with confirm dialog
- Non-draft row:
  - View (Eye)
  - Duplicate (Copy) → existing endpoint if you have it; if not, defer
- Icons: lucide-react
  - eye, pencil, trash, copy, briefcase (or building), info, alert-circle
- Each icon wrapped with a tooltip; buttons are icon-only for compact UI.

F) Status chips (cached)
- Chip set (from schema only):
  - All
  - Draft
  - Pending (union of pending_user_verification + pending_approval, computed in UI from grouped counts)
  - Approved
  - In progress
  - Completed
  - Rejected
  - Cancelled
- Count source:
  - groupBy by status; UI aggregates Pending by summing the two statuses.
- Clicking a chip only changes URL status[]; chips do not refetch counts unless invalidated.

G) Dashboard widget (thin, schema-aligned)
- Presets (no invoice concepts):
  - recent_completed: status in [completed], sort=updated_at:desc, limit=5
  - pending_review: status in [pending_user_verification, pending_approval], sort=created_at:asc, limit=5
  - in_progress: status in [in_progress], sort=updated_at:desc, limit=5
  - custom: accepts status[], q, date range, type, sort, limit
- Columns: Reference, Status, Created
- Actions: View (Eye)
- No totals or chips; just one list query.
- “View all” link builds /bookings?… with equivalent params.

H) Feature slice adjustments (brief)
- Keep existing structure; ensure:
  - list.routes.ts only emits supported params.
  - list.constants.ts only defines schema-valid statuses and sorts.
  - selectors: compute hasWorkingSpace from a boolean returned by API or from presence of 1 id in workspaceBookings select.
  - permissions: hide amount when user.status !== active.

I) Indexes to verify (schema-aligned)
- booking_request(userId, updatedAt DESC)
- booking_request(userId, status, updatedAt DESC)
- booking_request(userId, createdAt)
- booking_request(status) — already there
- booking_request(referenceNumber) — already there
- Optional search performance: pg_trgm on referenceNumber and projectDescription if q becomes heavy.

J) Request sequencing and dedupe
- On initial mount: fire list and statusCounts in parallel.
- Debounce q; on filter/sort change, reset page=1 and refetch list only.
- Chips counts reuse cache; invalidate both list and counts after mutations (delete, create, status change).
- For widget and list open simultaneously, share the same statusCounts key (or omit counts in widget).

K) Acceptance criteria (optimized path)
- Main list interaction = 2 queries (rows + total); with chips visible = +1 grouped count.
- No user lookup per request (userId from session).
- COUNT queries have no OFFSET/LIMIT.
- Chips don’t refetch on chip click; only on data-changing mutations or after staleTime.
- UI uses Lucide icons with tooltips; no verbose buttons.
- Only schema-valid statuses/filters present.

L) UI polish
- Replace action buttons with icon-only controls + tooltip text: “View”, “Edit”, “Delete”, “Duplicate”
- Status badge colors map:
  - draft: gray
  - pending_user_verification: amber
  - pending_approval: amber
  - approved: blue
  - in_progress: indigo
  - completed: green
  - rejected: red
  - cancelled: slate
- Indicators:
  - has working space: briefcase icon with tooltip “Includes working space”
  - info tooltip on status header to explain lifecycle

This plan keeps you tightly aligned to your Prisma schema and current APIs, trims redundant queries, and simplifies the UI with icon actions and cached chips.