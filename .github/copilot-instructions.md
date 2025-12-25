# Agent Guide: Building Features in CHECA

This guide is for AI coding agents to quickly understand how to build new features following Feature-Sliced Design (FSD) patterns established in this codebase.

## Quick Reference

### Layer Dependencies (What Can Import What)
```
app → widgets → features → entities → shared
      ↓           ↓           ↓         ↓
      Can import everything below it in the chain
```

### File Locations Quick Reference
| What to Create | Where to Put It |
|---------------|-----------------|
| TanStack Query hooks | `entities/<entity>/api/use*.ts` |
| Query keys factory | `entities/<entity>/api/query-keys.ts` |
| Prisma data fetching | `entities/<entity>/server/*.ts` |
| TypeScript types/interfaces | `entities/<entity>/model/types.ts` |
| Zod schemas | `entities/<entity>/model/schema.ts` or `features/<feature>/model/schema.ts` |
| Feature UI components | `features/<feature>/ui/*.tsx` |
| Feature helpers (formatting) | `features/<feature>/lib/helpers.ts` |
| Feature constants | `features/<feature>/model/constants.ts` |
| API routes | `app/api/<path>/route.ts` |
| Pages | `app/(main)/<path>/page.tsx` |
| Shared UI components | `shared/ui/*.tsx` |
| shadcn components | `shared/ui/shadcn/*.tsx` |

---

## Step-by-Step: Building a New Feature

### Example: Building an "Admin Invoice Details" Feature

#### Step 1: Identify Required Layers
- **Entity needed**: `invoice` (already exists)
- **Feature needed**: `invoices/admin/details` (new)
- **API route needed**: `/api/admin/invoices/[id]` (new)
- **Page needed**: `app/(main)/admin/invoices/[id]/page.tsx` (new)

#### Step 2: Create Entity Types (if new)
```typescript
// entities/invoice/model/types.ts
export interface InvoiceDetailVM {
  id: string;
  invoiceNumber: string;
  amount: number;
  status: InvoiceStatus;
  booking: {
    id: string;
    customer: { name: string; email: string };
  };
  lineItems: InvoiceLineItem[];
  payments: Payment[];
  createdAt: Date;
}
```

#### Step 3: Create Server Repository
```typescript
// entities/invoice/server/detail-repository.ts
import { db } from "@/shared/server/db";
import type { InvoiceDetailVM } from "../model/types";

export async function getInvoiceDetailData(id: string): Promise<InvoiceDetailVM | null> {
  const invoice = await db.invoice.findUnique({
    where: { id },
    include: {
      booking: {
        include: { customer: true },
      },
      lineItems: true,
      payments: true,
    },
  });
  
  if (!invoice) return null;
  
  return {
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    // ... map other fields
  };
}
```

#### Step 4: Add Query Keys
```typescript
// entities/invoice/api/query-keys.ts
export const invoiceKeys = {
  all: ["invoices"] as const,
  detail: (id: string) => [...invoiceKeys.all, "detail", id] as const,
  list: (params: Record<string, unknown>) => [...invoiceKeys.all, "list", params] as const,
};
```

#### Step 5: Create TanStack Query Hook
```typescript
// entities/invoice/api/useInvoiceDetail.ts
import { useQuery } from "@tanstack/react-query";
import type { InvoiceDetailVM } from "../model/types";
import { invoiceKeys } from "./query-keys";

export function useInvoiceDetail(id: string) {
  return useQuery<InvoiceDetailVM>({
    queryKey: invoiceKeys.detail(id),
    queryFn: async () => {
      const res = await fetch(`/api/admin/invoices/${id}`);
      if (!res.ok) throw new Error("Failed to load invoice");
      return res.json();
    },
    enabled: Boolean(id),
  });
}
```

#### Step 6: Export from Entity Index
```typescript
// entities/invoice/api/index.ts
export { invoiceKeys } from "./query-keys";
export { useInvoiceDetail } from "./useInvoiceDetail";
```

#### Step 7: Create API Route
```typescript
// app/api/admin/invoices/[id]/route.ts
import { createProtectedHandler } from "@/shared/server/protected";
import { getInvoiceDetailData } from "@/entities/invoice/server/detail-repository";

export const GET = createProtectedHandler(
  ["lab_administrator"],
  async (req, { params }) => {
    const { id } = await params;
    const data = await getInvoiceDetailData(id);
    
    if (!data) {
      return Response.json({ error: "Invoice not found" }, { status: 404 });
    }
    
    return Response.json(data);
  }
);
```

#### Step 8: Create Feature Helpers
```typescript
// features/invoices/admin/details/lib/helpers.ts
import { format } from "date-fns";

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function formatInvoiceDate(date: Date | string): string {
  return format(new Date(date), "MMM dd, yyyy");
}
```

#### Step 9: Create Feature UI Components
```typescript
// features/invoices/admin/details/ui/InvoiceHeader.tsx
"use client";

import { Badge } from "@/shared/ui/shadcn/badge";
import { Button } from "@/shared/ui/shadcn/button";
import type { InvoiceDetailVM } from "@/entities/invoice/model/types";
import { formatInvoiceDate } from "../lib/helpers";

interface InvoiceHeaderProps {
  invoice: InvoiceDetailVM;
}

export function InvoiceHeader({ invoice }: InvoiceHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold">Invoice #{invoice.invoiceNumber}</h1>
        <p className="text-sm text-slate-500">
          Created {formatInvoiceDate(invoice.createdAt)}
        </p>
      </div>
      <Badge>{invoice.status}</Badge>
    </div>
  );
}
```

```typescript
// features/invoices/admin/details/ui/InvoiceDetail.tsx
"use client";

import type { InvoiceDetailVM } from "@/entities/invoice/model/types";
import { InvoiceHeader } from "./InvoiceHeader";
import { LineItemsTable } from "./LineItemsTable";
import { PaymentHistory } from "./PaymentHistory";

interface InvoiceDetailProps {
  invoice: InvoiceDetailVM;
}

export function InvoiceDetail({ invoice }: InvoiceDetailProps) {
  return (
    <div className="space-y-6">
      <InvoiceHeader invoice={invoice} />
      <LineItemsTable items={invoice.lineItems} />
      <PaymentHistory payments={invoice.payments} />
    </div>
  );
}
```

#### Step 10: Create Feature Index
```typescript
// features/invoices/admin/details/index.ts
/**
 * Invoice Admin Details Feature
 * 
 * Note: useInvoiceDetail hook is in @/entities/invoice/api
 */

export * from "./lib/helpers";
export { InvoiceDetail } from "./ui/InvoiceDetail";
export { InvoiceHeader } from "./ui/InvoiceHeader";
export { LineItemsTable } from "./ui/LineItemsTable";
export { PaymentHistory } from "./ui/PaymentHistory";
```

#### Step 11: Create Page
```typescript
// app/(main)/admin/invoices/[id]/page.tsx
"use client";

import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useInvoiceDetail } from "@/entities/invoice/api";
import { InvoiceDetail } from "@/features/invoices/admin/details";

export default function AdminInvoiceDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const { data: invoice, isLoading, error } = useInvoiceDetail(id);

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error || !invoice) {
    return <div>Invoice not found</div>;
  }

  return <InvoiceDetail invoice={invoice} />;
}
```

---

## Common Patterns

### 1. Query Key Factory Pattern
Always use a factory for query keys:
```typescript
export const entityKeys = {
  all: ["entity-name"] as const,
  list: (params: Params) => [...entityKeys.all, "list", params] as const,
  detail: (id: string) => [...entityKeys.all, "detail", id] as const,
};
```

### 2. Protected API Route Pattern
```typescript
import { createProtectedHandler } from "@/shared/server/protected";

export const GET = createProtectedHandler(
  ["lab_administrator"],  // allowed roles
  async (req, { user, params }) => {
    // handler logic
  }
);
```

### 3. Loading/Error States Pattern
```typescript
const { data, isLoading, error } = useEntity(id);

if (isLoading) return <LoadingSpinner />;
if (error || !data) return <ErrorMessage />;
return <Component data={data} />;
```

### 4. Form with Zod Validation Pattern
```typescript
// model/schema.ts
import { z } from "zod";

export const CreateEntitySchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
});

export type CreateEntityInput = z.infer<typeof CreateEntitySchema>;
```

### 5. Mutation Hook Pattern
```typescript
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { entityKeys } from "./query-keys";

export function useCreateEntity() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateEntityInput) => {
      const res = await fetch("/api/entity", {
        method: "POST",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: entityKeys.all });
    },
  });
}
```

---

## Checklist for New Features

- [ ] Identify which entity the feature relates to
- [ ] Create/update entity types in `model/types.ts`
- [ ] Create server repository in `entities/<entity>/server/`
- [ ] Create API route in `app/api/`
- [ ] Add query keys to `entities/<entity>/api/query-keys.ts`
- [ ] Create TanStack hook in `entities/<entity>/api/`
- [ ] Export hook from entity index
- [ ] Create feature folder structure under `features/`
- [ ] Create helpers in `lib/helpers.ts`
- [ ] Create UI components in `ui/`
- [ ] Create feature index with exports
- [ ] Create page in `app/(main)/`
- [ ] Run `pnpm tsc --noEmit` to verify no type errors

---

## Styling Guidelines

### Use Tailwind + shadcn/ui
```typescript
import { Button } from "@/shared/ui/shadcn/button";
import { Card, CardHeader, CardContent } from "@/shared/ui/shadcn/card";
import { Badge } from "@/shared/ui/shadcn/badge";
```

### Common Tailwind Patterns
```tsx
// Page container
<div className="space-y-6 p-6">

// Card grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

// Flex row with spacing
<div className="flex items-center justify-between gap-4">

// Text hierarchy
<h1 className="text-2xl font-bold text-slate-900">
<p className="text-sm text-slate-500">

// Status colors
<span className="text-green-600 bg-green-50">
<span className="text-yellow-600 bg-yellow-50">
<span className="text-red-600 bg-red-50">
```

### Icons
Use `lucide-react`:
```typescript
import { ArrowLeft, Check, X, MoreHorizontal } from "lucide-react";

<ArrowLeft className="h-4 w-4" />
```

---

## Anti-Patterns to Avoid

1. **❌ Don't put TanStack hooks in features** - Put them in entities
2. **❌ Don't import features from other features** - Use shared or entities
3. **❌ Don't call Prisma from components** - Use server repositories + API routes
4. **❌ Don't skip the barrel export (index.ts)** - Always export from index
5. **❌ Don't put business logic in pages** - Pages should just compose components
6. **❌ Don't duplicate types** - Define once in entity, import everywhere

---

## Existing Entity Reference

| Entity | Location | Key Exports |
|--------|----------|-------------|
| booking | `entities/booking/` | `useBookingCommandCenter`, `useBookingsList`, `bookingKeys` |
| sample-tracking | `entities/sample-tracking/` | `useSampleOperationsList`, `StatusBadge` |
| workspace-booking | `entities/workspace-booking/` | `useWorkspaceScheduleForRange` |
| service | `entities/service/` | Service types and API |
| invoice | `entities/invoice/` | Invoice types |
| notification | `entities/notification/` | Notification types |

---

## Troubleshooting

### TypeScript Errors
1. Run `pnpm tsc --noEmit` to see all errors
2. Check imports are using correct paths (`@/entities/...` not relative)
3. Ensure all index.ts files export what's needed

### Missing shadcn Component
```bash
pnpm dlx shadcn@latest add <component-name>
# Example: pnpm dlx shadcn@latest add dropdown-menu
```

### Query Not Updating
- Check query keys match
- Use `queryClient.invalidateQueries({ queryKey: entityKeys.all })` after mutations
