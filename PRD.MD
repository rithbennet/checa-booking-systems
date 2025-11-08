1. Product Overview

- Summary
  - ChECA Lab Service Booking Management System is a web application that digitizes the end-to-end lifecycle of lab service requests for Chemical Energy Conversions & Applications (ChECA) Lab. It enables users to register, browse services with role-based pricing, submit multi-service bookings (analysis services + working space), manage documentation and signatures, handle invoices and payment proofs, track samples and working space usage, and securely receive analysis results—all with automated notifications and audit trails.
- Target Audience and Problems Solved
  - MJIIT/UTM Members (students, staff, researchers): Simplifies discovering services, submitting accurate, multi-service bookings, tracking status, and receiving results.
  - External Members (industry, other institutions): Provides a professional, traceable workflow for service requests, pricing, invoices, and results delivery.
  - Lab Administrators: Centralizes user verification, catalog/pricing management, booking review/approval, post-approval modifications, sample tracking, document flows, and payment verification.
  - Core Problems Addressed: Eliminates fragmented manual processes (Google Forms/email), reduces turnaround time and errors, enforces consistent pricing and documentation, improves transparency via dashboards, notifications, and audit logs.
- Core Value Proposition and Differentiators
  - Unified, role-based, multi-service booking with consolidated pricing
  - Post-approval modification workflow with automatic price recalculation and customer re-approval
  - Consolidated service forms with offline signature upload and automatic finance forwarding
  - Manual financial workflow (no payment gateway) with verifiable payment proofs and reminders
  - Sample and working space tracking with status visibility and operating hours policy
  - Secure results portal with historical access and release gating on payment verification
  - Comprehensive audit trail of critical actions


2. Product Goals & Metrics

- Short-Term (MVP) Goals
  - Digitize the full lifecycle: registration → verification → multi-service booking → admin approval → forms/signature → invoice → payment proof → verify → results delivery
  - Reduce time-to-first-booking for new users to ≤15 minutes without assistance
  - Ensure administrators can verify users and approve bookings within 10 minutes after 30 minutes of training
  - Deliver reliable notifications for all workflow triggers
- Long-Term Goals
  - Improve request accuracy and reduce back-and-forth by ≥30%
  - Reduce average booking-to-results cycle time by ≥20%
  - Achieve ≥80% on-time payment within 14-day terms via reminders
  - Maintain ≥99.5% availability and high user satisfaction (CSAT ≥ 4.3/5)
- Success Metrics (examples)
  - Conversion: Registration → Verified (≥80%); Verified → First Booking (≥60%)
  - Performance: Initial page load ≤3s; form submit feedback ≤2s; search/filter ≤1s
  - Engagement: ≥70% of users view booking dashboard weekly while active
  - Quality: <1% failed uploads; <1% email bounce rate; <0.1% critical errors per 1k requests
  - Financial: ≥90% invoices paid within 14 days; <5% payment rejections
  - Operations: ≥95% of status updates with notifications sent within 60s


3. User Personas

- MJIIT/UTM Member (Student/Staff/Researcher)
  - Goals: Discover services and pricing for their role; submit accurate multi-service bookings; track sample progress; receive results quickly; manage documentation and payments
  - Motivations: Minimize administrative overhead, predictable timelines and costs
  - Frictions: Uncertainty in pricing/schedule, multi-step documentation
- External Member (Industry/Other Institution)
  - Goals: Access services with external pricing; handle invoice and payment proof efficiently; maintain traceability and documentation; receive results securely
  - Motivations: Professional, compliant process; clear communication and timelines
  - Frictions: Varying institutional processes; verification delays
- Lab Administrator
  - Goals: Verify users; maintain service catalog and role-based pricing; review/approve bookings; manage post-approval modifications; track samples; process documents and invoices; verify payments; release results
  - Motivations: Operational efficiency, compliance, reduced manual errors, traceability
  - Frictions: Volume of requests; ensuring data completeness; cross-team coordination (finance)
- Finance Team (email recipient, out-of-app)
  - Goals: Receive signed service forms; generate invoices; rely on accurate data
  - Motivations: Smooth, accurate handoffs; minimal corrections
  - Frictions: Missing or mismatched documentation


4. User Experience Overview

- Navigation Structure
  - Global: Dashboard, Browse Services, My Bookings, Documents, Financials, Results, Notifications, Profile
  - Administrator-only: Users, Services, Bookings, Samples, Financial Management, System Activity (summary), Settings (brand, notification templates)
- Key Journeys
  - Onboarding (All users)
    - Register (email/password or Google OAuth) → Provide institutional/external details → Account set to Pending → Admin verification → Active → Role-based access
  - Service Discovery and Booking
    - Browse services (role-based pricing, filters/sort) → Build multi-service booking (analysis + working space) with sample details and preferred dates → Submit → Email confirmation
  - Admin Booking Management
    - Review request → Approve / Partial Approve / Reject with notes → Notification to customer → When necessary, modify post-approval with auto price recalculation → Send proposal → Customer response (approve/reject/request changes)
  - Documentation & Finance
    - Generate consolidated service forms and working area agreement (after services complete) → Customer downloads PDFs, signs offline → Customer uploads signed forms → System forwards main service form to finance → Admin uploads official invoice → Customer uploads payment proof → Admin verifies (approve/reject)
  - Results
    - Admin uploads results (gated by payment verification) → Notify customer → Customer downloads results → Access historical results
  - Sample & Working Space Tracking
    - Admin updates sample statuses across lifecycle; customers track in dashboard → Working space bookings follow operating-hours policy
  - Notifications
    - Email and in-app notifications for registrations, booking status changes, modification proposals, documents readiness, invoices, payments, results availability, and reminders


5. Detailed Feature Specifications (Core Section)

Feature: User Registration (Email/Password + Google OAuth)
Description:
- Enables new users to create accounts and supply required institutional/external details. Accounts start as Pending until admin verification.
User Story:
- As a potential user, I want to register and provide my details so I can request lab services.
User Flow:
- Open Register → Choose Email/Password or Sign up with Google → Fill required fields based on suggested/selected role → Submit → See confirmation of Pending status and email sent.
Frontend Requirements:
- Responsive, multi-step form; inline validation; password strength meter; auto-suggest role by domain; institutional/external fields; accessibility (ARIA, focus states).
Backend Requirements:
- Create user with status=pending; hash passwords; store OAuth identities; send confirmation email; notify admins of new pending registration; audit log creation.
Acceptance Criteria:
- [ ] Register with email/password; [ ] Register via Google OAuth
- [ ] Auto-suggest role for @utm.my/@graduate.utm.my; overridable
- [ ] Required fields vary by role; inline validation errors
- [ ] Account created as Pending; confirmation email sent; admin notified
- [ ] Audit trail entry created
Dependencies:
- OAuth provider (Google), SMTP/email service
Notes:
- Enforce unique email; rate-limit registration; prevent disposable emails (TBD)

Feature: Institutional Role Auto-Suggestion
Description:
- Suggests MJIIT/UTM role by domain; adapts required fields accordingly.
User Story:
- As a UTM member, I want my role suggested so the form is streamlined.
User Flow:
- Enter email → UI suggests role and shows appropriate fields; user can override.
Frontend Requirements:
- Domain detection; role chip with ability to confirm/override; dynamic form sections.
Backend Requirements:
- Heuristic check on email domain; store chosen role; log suggestion use.
Acceptance Criteria:
- [ ] Detect institutional domains; [ ] Present suggested role; [ ] Allow override; [ ] Form adapts fields
Dependencies:
- Domain configuration list (admin-managed, TBD)
Notes:
- Maintain a whitelist of domains for maintainability.

Feature: Institutional Verification Fields
Description:
- Collects faculty/department/matric or staff ID for institutional members.
User Story:
- As an institutional member, I must provide verification data for admin review.
User Flow:
- Role = MJIIT/UTM → Faculty dropdown; Department free text; Matric/Staff ID fields (required) → Submit.
Frontend Requirements:
- Dropdown for faculty (predefined list); required field markers; help text.
Backend Requirements:
- Persist institutional fields; surface in admin review; audit log.
Acceptance Criteria:
- [ ] Faculty dropdown; [ ] Department field; [ ] Matric/Staff ID required; [ ] Data visible in admin review
Dependencies:
- Predefined faculties list
Notes:
- Validation rules for ID formats (TBD per institution).

Feature: External Organization Details
Description:
- Collects organization name, address, contact information for external users.
User Story:
- As an external member, I must provide my organization details for verification.
User Flow:
- Role = External → Company name, address lines, contact person, phone → Submit.
Frontend Requirements:
- Address inputs; country/state dropdowns (TBD); validation masks for phone.
Backend Requirements:
- Store organization entity; link to user; audit log.
Acceptance Criteria:
- [ ] Organization name/address required; [ ] Contact details required; [ ] Data visible in admin review
Dependencies:
- Address format standards (TBD)
Notes:
- Consider future support for multiple contacts per organization.

Feature: Secure Login & Session Management
Description:
- Allows login via email/password or Google OAuth; routes to role-based dashboards and enforces account status.
User Story:
- As a user, I want secure login and dashboard access based on my role.
User Flow:
- Visit Login → Choose method → If Active → Dashboard; If Pending → Limited access view; If Suspended/Rejected → Message.
Frontend Requirements:
- Login form; OAuth button; password reset link; error states; accessible forms.
Backend Requirements:
- Auth endpoints; session management; CSRF protection; last_login_at update; role/status checks; audit logs.
Acceptance Criteria:
- [ ] Email/password and OAuth login
- [ ] Pending users blocked from bookings; can browse services without pricing
- [ ] Suspended/Rejected handled with clear messages
- [ ] Password reset email flow
Dependencies:
- OAuth, SMTP/email service
Notes:
- Implement brute-force protection and MFA (TBD).

Feature: User Profile Management
Description:
- Users update personal and affiliation information.
User Story:
- As a user, I want to keep my contact and affiliation details current.
User Flow:
- Profile → Edit → Save → Confirmation.
Frontend Requirements:
- Editable profile form; validation; accessible controls.
Backend Requirements:
- Update endpoints; input validation; audit logging.
Acceptance Criteria:
- [ ] Editable fields relevant to role; [ ] Validation; [ ] Audit trail
Dependencies:
- RBAC authorization
Notes:
- Some fields (email) might require re-verification (TBD).

Feature: Admin – Review and Approve Users
Description:
- Admins review Pending registrations, approve/reject; can suspend/reactivate accounts; view all users.
User Story:
- As an admin, I want to verify accounts before enabling bookings.
User Flow:
- Admin → Users tab → Filter Pending → Review details → Approve/Reject (with reason) → User notified.
Frontend Requirements:
- Admin tables with filters/sort; detail drawer; bulk actions; status badges.
Backend Requirements:
- Approve/reject/suspend/reactivate endpoints; notifications; audit logs.
Acceptance Criteria:
- [ ] Pending list with filters; [ ] Approve/Reject with reason; [ ] Status change notifications; [ ] Bulk actions; [ ] Audit logs
Dependencies:
- Email service
Notes:
- Include search by email/name/institution; bulk approve with caution.

Feature: Service Catalog Management (Admin)
Description:
- Create/update services with descriptions, technical specs, category, unit, availability, and role-based pricing.
User Story:
- As an admin, I need to maintain an accurate service catalog and pricing.
User Flow:
- Admin → Services → New/Edit Service → Enter details and rates per role → Activate/Deactivate.
Frontend Requirements:
- CRUD forms; price fields per role; toggles; validation; accessibility.
Backend Requirements:
- Services schema; pricing per role; soft delete/activation; audit logs.
Acceptance Criteria:
- [ ] Create/update services; [ ] Role-based prices; [ ] Activate/Deactivate; [ ] Visible to users appropriately; [ ] Audit logs
Dependencies:
- RBAC, database
Notes:
- Consider service prerequisites/dependencies (TBD constraints rules).

Feature: Browse Services (Users)
Description:
- Users view services with role-based pricing (Active accounts). Pending users may see services without pricing.
User Story:
- As a user, I want to browse services and see pricing for my role.
User Flow:
- Dashboard → Browse Services → Filter/sort → View details → Add to booking cart.
Frontend Requirements:
- Cards/table with filters, sort; responsive grid; price labels by role; tooltips; 25 rows/page pagination.
Backend Requirements:
- List services scoped by role/status; pricing resolution; caching for fast load.
Acceptance Criteria:
- [ ] Role-based pricing displayed for Active users; [ ] Pending users see “verification required for pricing”
- [ ] Filters (category, availability, price); [ ] Sort; [ ] Pagination
Dependencies:
- RBAC, catalog
Notes:
- Ensure price currency/format consistency (TBD).

Feature: Multi-Service Booking Builder
Description:
- Users create booking requests combining analysis services and working space; enter per-service sample details and preferred dates; consolidated pricing by role.
User Story:
- As a user, I want one booking for multiple services with accurate pricing.
User Flow:
- From Browse or New Booking → Add services → For each service, fill required fields (samples, quantities; for working space: duration, dates) → Overall project info → Review summary → Submit → Confirmation.
Frontend Requirements:
- Multi-step form with progress; per-service dynamic fields; date pickers; auto-save drafts every 30 seconds; inline validation; accessibility.
Backend Requirements:
- Booking schema with items; pricing calculation engine by role; validation rules; unique booking ID; status=pending approval; notifications; audit logs.
Acceptance Criteria:
- [ ] Add multiple services (analysis + working space)
- [ ] Per-service required fields enforced
- [ ] Consolidated pricing by role; displayed before submit
- [ ] Auto-save drafts; booking ID generated; confirmation email to user and admin notification
- [ ] Handle validation errors (incompatible combinations, missing sample info)
Dependencies:
- Catalog/pricing, email service
Notes:
- Complex scheduling conflict detection is out-of-scope; basic availability checks only for working space as per SRS.

Feature: Admin – Manage Booking Requests
Description:
- Admin reviews booking details; approves, partially approves, or rejects with notes; filter by status.
User Story:
- As an admin, I want to make informed decisions on booking requests.
User Flow:
- Admin → Bookings → Filter → Open request → Review details (services, samples, timeline, pricing) → Decide → Notes → Submit → Notifications sent.
Frontend Requirements:
- Tables with filters; request detail view; decision forms; notes inputs.
Backend Requirements:
- Status transition logic; partial approval selection; recalculated totals; notifications; audit logging.
Acceptance Criteria:
- [ ] Approve/Partial Approve/Reject with notes
- [ ] Status updates; customer notified
- [ ] Filter by status/date/type; results update in real-time
- [ ] Audit trail updated
Dependencies:
- Email service
Notes:
- Partial approval requires clear presentation of approved subset and recalculated totals.

Feature: Admin – Modify Booking Post-Approval
Description:
- Admin modifies approved booking quantities/durations/timelines; system auto-recalculates pricing; sends proposal to customer for approval.
User Story:
- As an admin, I want to adjust bookings due to operational needs with customer consent.
User Flow:
- Admin → Approved bookings → Modify → Validate constraints → Auto recalc price → Add justification → Send proposal → Booking status “modification pending”.
Frontend Requirements:
- Side-by-side diff view (original vs modified); justification textarea; price delta highlighting.
Backend Requirements:
- Modification request entity linked to booking; pricing recalculation; notifications; status transitions; audit logs.
Acceptance Criteria:
- [ ] Change quantities/duration/timelines
- [ ] Auto price recalculation; show delta
- [ ] Send proposal email with comparison
- [ ] Booking set to “modification pending”
Dependencies:
- Pricing engine; email
Notes:
- If resource constraints prohibit changes, show alternatives (TBD rules).

Feature: Customer – Approve/Reject/Request Changes to Modification
Description:
- Customers review proposed changes, see pricing/timeline impact, and respond (approve/reject/request changes). Partial approval option.
User Story:
- As a customer, I want control over changes that affect my services/costs.
User Flow:
- Notification → Login → Pending Modifications → Open → Review side-by-side → Decide → Submit → Confirmation and admin notified.
Frontend Requirements:
- Clear diff and price change; response options; mandatory reasons on reject; optional comments on approve.
Backend Requirements:
- Record decision with timestamp; update booking based on decision; notify admin; audit logs.
Acceptance Criteria:
- [ ] Side-by-side comparison; [ ] Decision captured; [ ] Notifications sent; [ ] Booking updated accordingly
Dependencies:
- Modification workflow; notifications
Notes:
- Proposal expiry handling required (TBD duration).

Feature: Sample Tracking (Admin) and Customer Visibility
Description:
- Admin updates sample statuses through lifecycle; customers can monitor status; batch updates; issue reporting; retroactive updates with audit trail.
User Story:
- As an admin, I want to keep customers informed of sample progress. As a customer, I want real-time status visibility.
User Flow:
- Admin → Samples → Filter by status → Update status with notes → Customer notified → Customer → My Bookings/Samples → View timeline.
Frontend Requirements:
- Admin sample dashboard; status dropdowns; batch select; issue report form; customer timeline UI with badges.
Backend Requirements:
- Status transitions validation; history records; notifications; audit logs.
Acceptance Criteria:
- [ ] Statuses: received, in queue, in progress, analysis complete, results available, returned
- [ ] Batch updates; [ ] Issue reporting; [ ] Notifications to customer; [ ] Full history visible
Dependencies:
- Email service
Notes:
- Support “return_requested → returned” sub-flow for sample returns.

Feature: Working Space Booking & Operating Hours Policy
Description:
- Supports working space rental (bench/month) and enforces an operating-hours policy (Mon–Fri, 8:00–17:00) as guidance.
User Story:
- As a user, I want to book working space with clear hours and durations. As an admin, I want to track usage periods.
User Flow:
- Add working space service → Select duration/dates → Submit → Admin approve → Track duration.
Frontend Requirements:
- Date pickers; duration selector; policy info tooltip; indicators for operating hours.
Backend Requirements:
- Store durations; enforce simple availability checks; compute billing units; track usage periods.
Acceptance Criteria:
- [ ] Working space can be added to booking; [ ] Duration captured; [ ] Policy displayed to users; [ ] Duration tracked in admin view
Dependencies:
- Catalog/pricing
Notes:
- No real-time slot conflict detection (out-of-scope as per SRS).

Feature: Generate Service Forms and Working Area Agreements (Admin)
Description:
- After services completion, generate standardized PDFs (service form, working area agreement, financial summary) with branding; forms valid for 30 days.
User Story:
- As an admin, I want accurate, branded documentation to send to customers.
User Flow:
- Admin → Completed Bookings → Generate Forms → Preview → Approve → Customer notified to download.
Frontend Requirements:
- Generate action; preview modal; indicators of form validity period.
Backend Requirements:
- Document generation service; template population; secure storage; assign doc IDs; audit log; set validity window.
Acceptance Criteria:
- [ ] Forms generated with correct data and branding
- [ ] Unique document IDs; [ ] Forms available for 30 days; [ ] Customer notified
Dependencies:
- Document generation service; email
Notes:
- Partial service completion supports partial forms.

Feature: Download Unsigned Service Forms (Customer)
Description:
- Customers download unsigned forms for offline signature.
User Story:
- As a customer, I want to review and sign my forms.
User Flow:
- Documents → Download → Local signature process.
Frontend Requirements:
- Document listing per booking; download links; validity countdown.
Backend Requirements:
- Secure links; access control; download logging.
Acceptance Criteria:
- [ ] Forms downloadable as PDFs; [ ] Validity warning; [ ] Download logged
Dependencies:
- File storage
Notes:
- Multi-language templates (future-ready via text externalization).

Feature: Upload Signed Documents with Digital Signature Validation
Description:
- Customers upload signed PDFs; system validates signatures and integrity; for service forms, automatically email to finance and set billing status.
User Story:
- As a customer, I want confirmation my signed documents are accepted and forwarded.
User Flow:
- Documents → Upload → Validation → Success confirmation → Finance auto-forwarded (service form).
Frontend Requirements:
- Drag-and-drop; progress; validation messages; replace document function; batch upload for multiple documents.
Backend Requirements:
- File validation (format/size), digital signature verification (TBD vendor), integrity checks, associate to booking, finance email send, archive copy, audit logs.
Acceptance Criteria:
- [ ] Accept PDF with digital signatures (max size per SRS: 10MB)
- [ ] Validate signatures and integrity; [ ] Associate with correct booking
- [ ] Finance auto-forward of main service form; [ ] Customer confirmation email
Dependencies:
- Document validation service; email to finance team; file storage
Notes:
- If validation fails, provide actionable errors and allow re-upload.

Feature: Admin – Upload Official Invoices
Description:
- Admin uploads invoices received from finance; system notifies customer with payment instructions and 14-day terms.
User Story:
- As an admin, I want to publish official invoices for customers to pay.
User Flow:
- Financial Management → Select booking → Upload invoice → Review details → Release → Customer notified.
Frontend Requirements:
- Upload with preview; due date display; notes field for payment instructions.
Backend Requirements:
- Invoice storage; link to booking; content extraction (best-effort) to validate; notifications; reminders scheduling; audit log.
Acceptance Criteria:
- [ ] Accept PDF/JPG/PNG (≤5MB)
- [ ] Invoice linked to booking; [ ] Customer notification with due date; [ ] Reminder schedule started
Dependencies:
- Email service; file storage
Notes:
- Handle multiple invoices per booking when needed.

Feature: Upload Payment Proof (Customer)
Description:
- Customers upload payment proof with payment details (amount, method, date, reference); supports multiple payments for one invoice.
User Story:
- As a customer, I want to submit proof so my payment can be verified quickly.
User Flow:
- Financials → Select invoice → Upload proof → Enter details → Submit → Confirmation.
Frontend Requirements:
- Form with payment method selection; file upload; discrepancy warning if amount differs; late submission warnings.
Backend Requirements:
- File validation (≤5MB; PDF/JPG/PNG/DOC); store payment details; create verification task; audit log; notify admins.
Acceptance Criteria:
- [ ] Supported formats; [ ] Required details (amount, date, reference, method)
- [ ] Multiple payment entries supported; [ ] Confirmation email
Dependencies:
- File storage; email
Notes:
- Provide example proof images/documents for clarity.

Feature: Verify Payment (Admin)
Description:
- Admin compares payment proofs against invoices; approves/rejects/requests clarification; supports partial and overpayments; triggers results release upon approval.
User Story:
- As an admin, I must confirm valid payment before releasing results.
User Flow:
- Financial Management → Pending verifications → Open → Compare → Decide → Notes → Notify customer → If approved, enable results.
Frontend Requirements:
- Side-by-side invoice vs payment view; decision buttons; required reason on rejection; flags for refund if overpayment.
Backend Requirements:
- Status updates; results release gate; notifications; audit logs; refund flag to finance (notification).
Acceptance Criteria:
- [ ] Approve/Reject/Clarify; [ ] Handle partial/overpayment; [ ] Gate results until approved
- [ ] Customer notified; [ ] Audit logged
Dependencies:
- Email service
Notes:
- Some external reference verification (bank) may be manual; record notes.

Feature: Upload Analysis Results (Admin) with Payment Gate
Description:
- Admin uploads results files (raw, processed, charts, reports) organized by analysis; system releases access only after payment verified; notify customers when available.
User Story:
- As an admin, I want to securely deliver results once payment is confirmed.
User Flow:
- Results dashboard → Select sample/booking → Upload files and documentation → Preview → Approve release → Customer notified.
Frontend Requirements:
- Multiple file selection; grouping by analysis; metadata entry; preview; large file progress; clear payment gating indicator.
Backend Requirements:
- File validation formats; size limit per SRS: up to 50MB per file; access control; release workflow; notifications; audit logs; archival.
Acceptance Criteria:
- [ ] Support multiple file types (PDF, CSV, images, Excel)
- [ ] Organized by analysis; [ ] Payment gating enforced; [ ] Customer notified on availability
Dependencies:
- File storage; email
Notes:
- Partial results upload tracked until complete.

Feature: Download Results and Historical Access (Customer)
Description:
- Customers securely download individual files, analysis categories, or a complete package; view historical results; download audit trail maintained.
User Story:
- As a customer, I want convenient, secure access to my results now and later.
User Flow:
- Results → Booking → Select files or download all → Confirm → Download; Historical tab for past results.
Frontend Requirements:
- File tree or sections; download actions; progress/resume on large files; mobile-friendly previews.
Backend Requirements:
- Secure links; permission checks; download logging; optional email confirmation of download.
Acceptance Criteria:
- [ ] Secure downloads; [ ] Historical access; [ ] Download history tracked
- [ ] Re-authentication required on session timeout
Dependencies:
- File storage; auth
Notes:
- If payment status changes (e.g., reversed), block downloads and show message.

Feature: Automated Notifications (Email + In-App)
Description:
- System sends notifications for key events: registration, verification, booking submissions/decisions, modification proposals and responses, forms ready, signed forms received, invoice available, payment reminders, payment decisions, results ready.
User Story:
- As a user/admin, I want timely notifications so I can act without checking constantly.
User Flow:
- Event occurs → Notification generated → Email sent + in-app bell indicator → User opens and marks as read; Preferences can be adjusted (TBD scope).
Frontend Requirements:
- In-app notifications panel with unread/read; per-event links; indicators.
Backend Requirements:
- Notification templates; email sending; mapping to in-app items; preferences storage (email vs in-app).
Acceptance Criteria:
- [ ] Notifications generated for all listed events
- [ ] Email + in-app parity; [ ] Click-through to relevant page
Dependencies:
- Email service
Notes:
- Template customization by admins (content variables) is desirable.

Feature: Dashboards (User and Admin)
Description:
- Role-based dashboards with quick actions, status summaries, and recent activity.
User Story:
- As a user, I want to see my bookings and alerts. As an admin, I want operational summaries and quick access to tasks.
User Flow:
- Login → Dashboard shows metrics and actionable lists.
Frontend Requirements:
- User: Quick links; bookings table; recent notifications; filters
- Admin: Tiles for pending verifications, approvals, overdue payments; tabs for Users/Services/Bookings/Financial/Samples
Backend Requirements:
- Aggregation endpoints for counts; role-based visibility.
Acceptance Criteria:
- [ ] User dashboard aligned with SRS layout
- [ ] Admin dashboard shows pending counts and activity log
Dependencies:
- RBAC; data aggregation
Notes:
- Consider caching for counts to meet performance targets.

Feature: Audit Trail (System-Level)
Description:
- Logs significant actions: user creation/status changes, booking modifications, document uploads, payment verifications, results releases.
User Story:
- As the institution, we need traceability for compliance and troubleshooting.
User Flow:
- Background logging; admin-facing full log UI is not required in v1 (developer/system admin access).
Frontend Requirements:
- N/A (optional summary on admin dashboard).
Backend Requirements:
- Append-only log entries with actor, action, entity, timestamp, metadata; secure storage with retention policies.
Acceptance Criteria:
- [ ] Audit entries created for defined events
- [ ] Logs are immutable and searchable by system admins
Dependencies:
- Centralized logging service/storage
Notes:
- PII handling in logs should be minimized/masked.

Feature: RBAC and Role-Based Pricing Enforcement
Description:
- Enforces permissions and prices across the app based on role and account status.
User Story:
- As an admin, I want correct access and pricing automatically enforced.
User Flow:
- Background: each request checks role and status.
Frontend Requirements:
- Conditional UI; hide/disable unauthorized actions.
Backend Requirements:
- RBAC middleware; role-based pricing resolver; status gates.
Acceptance Criteria:
- [ ] Only Active users can submit bookings; Pending cannot
- [ ] Pricing displayed only to Active users; correct pricing applied at calculation
Dependencies:
- Auth, catalog/pricing
Notes:
- Future: support additional roles if needed.

Feature: Settings – Email Server and Branding
Description:
- Configure SMTP/API credentials; upload logos and set color scheme; manage notification templates.
User Story:
- As an admin, I want to configure email and branding without code changes.
User Flow:
- Admin → Settings → Email/Branding → Save → Test email.
Frontend Requirements:
- Forms for config; test button; logo upload; preview.
Backend Requirements:
- Store settings securely (secrets as env vars); apply branding to documents; send test emails.
Acceptance Criteria:
- [ ] Save and test email settings
- [ ] Branding reflected on generated documents
Dependencies:
- Email service; document generator
Notes:
- Environment-specific overrides for secrets.

Feature: Payment Reminders Engine
Description:
- Automated reminders for invoices with 14-day terms; escalations on overdue accounts.
User Story:
- As an admin, I want reminders sent automatically until payment proof is verified.
User Flow:
- Invoice released → Reminder schedule created → Emails sent at configured intervals → Stops on verification.
Frontend Requirements:
- Admin view of reminder status; override/snooze (optional).
Backend Requirements:
- Scheduled job or event-based worker; idempotent sends; stop conditions.
Acceptance Criteria:
- [ ] Initial notice + reminders up to and after due date (TBD cadence)
- [ ] Stop on payment approval; [ ] Log each reminder sent
Dependencies:
- Email service; scheduler/cron
Notes:
- Exact cadence TBD with finance policy.


6. Non-Functional Requirements

- Performance
  - Initial page load under 3 seconds on standard broadband
  - Form submission feedback within 2 seconds
  - Search/filter response within 1 second
  - File upload progress visible within 500 ms
  - Support at least 100 concurrent users without significant degradation
- Security
  - HTTPS everywhere; secure password hashing; CSRF and XSS protection; SQL injection prevention
  - RBAC enforcement; session timeout with a 5-minute warning indicator; masked display for sensitive fields
  - Results downloads gated by payment verification; secure, expiring links
- Scalability
  - Horizontally scalable stateless web tier; database optimized with indexes and safe migrations
  - Caching of catalog and dashboard counters where appropriate
- Usability & Accessibility
  - WCAG 2.1 AA color contrast; keyboard navigability; ARIA labels; base font ≥14px; responsive layouts down to 375px width; touch targets ≥44px
  - New user can register and submit first booking within 15 minutes; Admin can verify accounts and approve bookings within 10 minutes after 30 minutes training
  - All primary functions reachable within 3 clicks from the dashboard
- Maintainability
  - TypeScript across stack; Git-based version control; code reviews; automated testing (unit/integration) on critical flows (auth, booking, payments, results)
  - Comprehensive audit logging of key events; environment-based configuration
- Availability & Reliability
  - Target uptime 99.5% subject to hosting; email notifications must queue/retry on transient failures
- Legal/Policy
  - Comply with UTM data privacy policies; research data protection; enforce 30-day service form validity; 14-day invoice terms; working space operational hours policy


7. Technical Notes

- Architecture and Stack
  - Frontend: Next.js + React (TypeScript), SSR/CSR as appropriate
  - Backend: Node.js (TypeScript), Next.js API routes or dedicated server
  - Database: PostgreSQL; ORM: Prisma; Migrations via Prisma Migrate
  - Hosting: Cloud (e.g., Vercel) or University servers; ensure TLS termination
  - Storage: Secure object storage for documents/results (TBD provider)
  - Email: SMTP or third-party provider (e.g., SendGrid); template-based
  - Document Generation: Template engine (TBD) to produce branded PDFs
  - Digital Signature Validation: External or library-based validation (TBD)
- Integrations
  - Google OAuth for authentication (no university SSO in scope)
  - Finance team receives emails with signed service forms; they do not log into the app
- Browser Support
  - Latest stable Chrome, Firefox, Safari, Edge and one prior major version
- File Size Limits (from SRS; conflict noted)
  - Global UI guideline earlier mentions 2MB/file; module specifics state:
    - Signed documents: ≤10MB
    - Invoices: ≤5MB
    - Payment proofs: ≤5MB
    - Analysis results: ≤50MB
  - Action: Align limits across system (see Open Questions)
- Communications
  - HTTPS for web; SMTP or Email API for outbound mail
- Logging & Monitoring
  - Centralized audit trail; error logging; email delivery logs; notification retries


8. Open Questions / Clarifications

- File Size Limits Conflict
  - UI section says max 2MB/file; use cases define 5–50MB. Which limits are authoritative per document type?
- Digital Signature Validation
  - What constitutes an acceptable “digital signature”? Is PKI-based signature required, or scanned/wet signature in PDF acceptable? Which validation vendor/library?
- Working Space Availability
  - Are there maximum concurrent working space allocations? Any monthly cap per user? How is availability checked beyond simple date overlap?
- Pricing & Currency
  - Currency and tax considerations (GST/VAT)? Rounding rules and discount policies (if any)?
- Modification Proposal Expiry
  - What’s the SLA/expiry for customer responses to modification proposals (e.g., 7 days)?
- Reminder Cadence
  - Exact schedule for payment reminders (e.g., day -7, day 0, day +7)?
- Document Templates
  - Who supplies final branded templates and localized text? Need bilingual templates (Future: localization)?
- Data Retention Policies
  - How long to retain user data, documents, and results? Archival and deletion policies?
- Roles Beyond Four
  - Any need for sub-roles (e.g., Lab Staff vs Lab Admin) with different permissions?
- Finance Workflow Variations
  - Edge cases: partial invoices, split billing across cost centers, refunds process and system flags/content expectations?
- Email Deliverability
  - DKIM/SPF setup responsibility? Bounce handling and alternate contact paths?
- Security Enhancements
  - MFA requirement for admins? IP allowlisting for admin endpoints?
- Accessibility Review
  - Any institutional accessibility checklist beyond WCAG 2.1 AA?
- Backups & DR
  - RTO/RPO targets with university/hosting providers? Test frequency?
- Guest Access
  - Should non-logged-in users see a public services overview (without pricing) for marketing?


9. Appendix (Traceability Mapping)

- User Management
  - SRS UC001/US001/US025/US026/US029 → PRD: Registration, Auto-Suggest Role, Institutional Verification, External Org Details
  - SRS UC002/US002 → PRD: Secure Login & Session Management
  - SRS UC003/US032–US035 → PRD: Admin Review/Approve Users; View/Suspend/Reactivate
- Service Catalog
  - SRS UC004/US004/US027–US031 → PRD: Browse Services (role-based), Admin Manage Services & Pricing
- Booking
  - SRS UC005/US005–US007 → PRD: Multi-Service Booking Builder
  - SRS UC006/US040–US043 → PRD: Admin Manage Booking Requests
  - SRS UC007/US044–US047 → PRD: Admin Modify Post-Approval; Customer Approve/Reject/Change
  - “View Booking Schedule” (overview) → PRD: Admin Booking views and filters
- Sample & Working Space
  - SRS UC014/US048/US023/US051 → PRD: Sample Tracking (Admin+Customer visibility)
  - Working space requirements → PRD: Working Space Booking & Operating Hours Policy; Sample Return Sub-flow
- Service Forms & Digital Signature
  - SRS UC009/US052/US014 → PRD: Generate Service Forms; Customer Download Unsigned Forms
  - SRS UC010/US015/US016/US053/US054 → PRD: Upload Signed Docs with Validation; Auto Finance Forward; Track Upload Status
- Financial Management
  - SRS UC011/US055/US017 → PRD: Admin Upload Invoices; Customer Receive Invoices
  - SRS UC013/US018 → PRD: Upload Payment Proof
  - SRS UC012/US056–US057/US019 → PRD: Verify Payment; Approve/Reject; Track Payment Status & Reminders
- Results Management
  - SRS UC015/US049/US021 → PRD: Upload Analysis Results; Results Ready Notifications
  - SRS UC016/US020/US022 → PRD: Download Results & Historical Access
- Cross-cutting
  - Notifications System → PRD: Automated Notifications
  - Dashboards → PRD: User and Admin Dashboards
  - Audit Trail → PRD: Audit Trail (System-Level)
  - Constraints/Interfaces → PRD: Technical Notes; Non-Functional Requirements

End of PRD.