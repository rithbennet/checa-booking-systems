This is a revised, comprehensive **Product Requirements Document (PRD)** for the **ChECA Lab Operations Management System**.

It is tailored for **Next.js 15 / React 19** development using your specific `package.json` stack (Better Auth, TanStack Query/Table, Biome) and addresses the complex business logic found in your PDF documents.

---

# Product Requirements Document (PRD)

**Project:** ChECA Lab Operations Management System
**Version:** 2.1 (Technical Specification)
**Date:** November 19, 2025
**Target Audience:** Senior Software Engineers, AI Coding Agents (Cursor/Windsurf)

## 1. Executive Summary
The ChECA Lab Operations system is a centralized, web-based platform replacing decentralized Google Forms/Excel workflows. It manages the full lifecycle of laboratory service bookings: user hierarchy verification, multi-service ordering (Analysis & Workspace), physical sample tracking, legal document generation, and financial gating of results.

**Core Business Constraint:** Results must **never** be downloadable by the client until payment is verified by an administrator.

---

## 2. Technical Architecture
**Based on `package.json` constraints:**

*   **Framework:** Next.js 15 (App Router) with Turbopack (`next dev --turbo`).
*   **Language:** TypeScript (`strict` mode).
*   **Database:** PostgreSQL with Prisma ORM (v6.6).
*   **Authentication:** Better Auth (`better-auth` v1.3) with Prisma Adapter.
*   **State Management:**
    *   *Server State:* TanStack Query v4.
    *   *Client State:* Zustand (for complex Booking Cart logic).
*   **UI Components:** Radix UI Primitives styled with Tailwind CSS v4.
*   **Data Display:** TanStack Table v8 (for Admin Dashboards).
*   **Forms:** React Hook Form + Zod.
*   **Icons:** Lucide React.
*   **Feedback:** Sonner (Toasts).
*   **Linting/Formatting:** Biome.

---

## 3. Database Schema & Data Models
*Refer to the provided Prisma Schema for exact field definitions. Key Enums driving logic:*

1.  **`user_type_enum`:** `mjiit_member` | `utm_member` | `external_member` | `lab_administrator`
2.  **`user_status_enum`:** `pending` | `active` | `rejected`
3.  **`booking_status_enum`:** `draft` | `pending_user_verification` | `pending_approval` | `approved` | `in_progress` | `completed`
4.  **`sample_status_enum`:** `pending` | `received` | `in_analysis` | `analysis_complete` | `return_requested` | `returned`

---

## 4. Functional Modules & Detailed User Flows

### 4.1 Module: User Management (Auth & Onboarding)
**Goal:** Strict hierarchy verification before booking access.

*   **Flow:**
    1.  **Sign Up:** User registers via Better Auth (Email or OAuth).
    2.  **Profile Completion (Wizard):**
        *   **Internal:** User selects Faculty -> Department -> Ikohza.
        *   **External:** User selects Company -> Branch.
    3.  **Verification Logic:**
        *   If email domain ends in `@utm.my` or `@graduate.utm.my` $\rightarrow$ Auto-suggest `utm_member` or `mjiit_member`.
        *   Set `User.status = pending`.
    4.  **Admin Review:** Admin views "Pending Users" via TanStack Table. Action: `Approve` (Active) or `Reject`.
    5.  **Access Control:** Middleware must block `/dashboard/booking` routes if `User.status !== active`.

### 4.2 Module: Service Catalog & Booking Engine
**Goal:** Multi-service cart with dynamic pricing.

*   **Pricing Logic:**
    *   Query `ServicePricing` table based on `Service.id` AND `User.userType`.
    *   *Example:* An "FTIR" test might cost RM50 for `mjiit_member` but RM150 for `external_member`.
*   **Booking Flow:**
    1.  **Selection:** User adds Services to Zustand Store (Cart).
    2.  **Configuration:**
        *   *Analysis Service:* Input Quantity, Sample Name, Hazard Level.
        *   *Workspace Service:* Input Start/End Date (React Day Picker), Duration.
    3.  **Submission (Server Action):**
        *   Wrap in `prisma.$transaction`.
        *   Create `BookingRequest`.
        *   Create `BookingServiceItem`s.
        *   If Analysis Service $\rightarrow$ Create initial `SampleTracking` records (Status: `pending`).
        *   If Workspace Service $\rightarrow$ Create `WorkspaceBooking` record.

### 4.3 Module: Sample & Result Management (Deep Dive)
**Goal:** Granular tracking of physical samples and digital result delivery.

**Detailed Flow:**

1.  **Sample Registration (Auto):**
    *   Upon Booking Submission, the system generates a `SampleTracking` row for every *quantity unit* of an analysis service.
    *   *ID Generation:* `SAM-{BookingRef}-{Index}` (e.g., `BK-001-01`).

2.  **Physical Drop-off (User -> Admin):**
    *   User brings sample to Lab.
    *   Admin scans/searches ID in "Sample Dashboard".
    *   **Action:** Admin clicks "Mark Received".
    *   **System:** Update `SampleTracking.status` $\rightarrow$ `received`. Record `receivedAt`. Send Email Notification via `resend` (or configured provider).

3.  **Analysis Phase (Admin):**
    *   Lab Tech starts work.
    *   **Action:** Admin updates status $\rightarrow$ `in_analysis`.
    *   **System:** Update `SampleTracking.status`. Log to `AuditLog`.

4.  **Completion & Upload (Admin):**
    *   Lab Tech finishes.
    *   **Action:** Admin updates status $\rightarrow$ `analysis_complete`.
    *   **Action:** Admin uploads Result File (PDF/XLS) to `AnalysisResult` table (linked to `SampleTracking`).
    *   **System:** Store file path. **Do not** email the file yet. Email: "Results Ready (Pending Payment)".

5.  **Return Workflow (Optional):**
    *   User clicks "Request Return" in dashboard.
    *   Status $\rightarrow$ `return_requested`.
    *   Admin hands over sample $\rightarrow$ `returned`.

### 4.4 Module: Service Forms & Digital Signatures
**Goal:** Generate legal PDF contracts.

*   **Flow:**
    1.  Admin clicks "Generate Form" on an Approved Booking.
    2.  System uses `react-pdf` or similar to render a PDF with Booking Details + Pricing + Terms.
    3.  Admin/System saves PDF path to `ServiceForm` table.
    4.  User downloads, signs offline, and uploads Signed PDF.
    5.  Admin verifies signature $\rightarrow$ Trigger Financial Module.

### 4.5 Module: Financial Management (The Gatekeeper)
**Goal:** Gating results behind verified payment.

*   **Flow:**
    1.  **Invoicing:** Admin uploads official Invoice PDF $\rightarrow$ `Invoice` table. Status: `sent`.
    2.  **Payment Submission:** User uploads Proof of Payment (Image/PDF) $\rightarrow$ `Payment` table. Status: `pending`.
    3.  **Verification:**
        *   Admin reviews Proof vs Invoice.
        *   Admin clicks "Verify Payment".
    4.  **The Unlock Trigger:**
        *   Update `Payment.status` $\rightarrow$ `verified`.
        *   Update `Invoice.status` $\rightarrow$ `paid`.
        *   **System Logic:** Query all `SampleTracking` items associated with this Booking. Enable "Download" button on User Dashboard.

---

## 5. UI/UX Specifications (Shadcn/Tailwind)

### 5.1 Admin Dashboard (`/admin`)
*   **Sidebar:** Users, Bookings, Samples, Finance, Settings.
*   **Sample Board (TanStack Table):**
    *   Columns: ID, Customer, Service, Status (Badge), Actions.
    *   Filters: "Pending Receipt", "In Analysis", "Return Requested".
    *   Bulk Actions: "Mark Selected as Received".

### 5.2 User Dashboard (`/dashboard`)
*   **Active Bookings Card:** Show latest booking status.
*   **Action Required:** Bright alerts for "Upload Signed Form" or "Pay Invoice".
*   **Sample Tracker:** A vertical stepper component showing the journey of their samples.

---

## 6. AI Agent Implementation Guide (Prompts)

Use these prompts sequentially with your AI coding agent.
l' is selected, show Company fields; if 'Internal', show Faculty/Ikohza fields. Implement the `@utm.my` email domain check to auto-suggest user type."

### Step 3: Service & Pricing (Server Actions)
> "Create a Server Action `getServicesWithPricing`. It should accept the current user's ID, fetch their `User` record to get `userType`, and then query `Service` include `ServicePricing` where `userType` matches. Return a flat object with the correct price for that user."

### Step 4: The Booking Mutation
> "Create a Server Action `submitBooking`. It must accept a complex object containing services and workspace details. Use `prisma.$transaction` to: 1) Create `BookingRequest`, 2) Create multiple `BookingServiceItem`, 3) If items are 'Analysis' type, create corresponding `SampleTracking` records automatically. Handle errors gracefully."

### Step 5: Sample Tracking UI
> "Build a `SampleManager` component using TanStack Table. Columns: ID, Service Name, Status. The Status column should be a Select dropdown that calls `updateSampleStatus` server action on change. Use optimistic updates with React Query."

### Step 6: Financial Gating Logic
> "Create a download API route `/api/download/result/[id]`. Logic: 1) Find the `AnalysisResult`. 2) Find the parent `BookingRequest`. 3) Check if `BookingRequest.invoices` has a `Payment` where `status === 'verified'`. If not, return 403 Forbidden. If yes, stream the file."