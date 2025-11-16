Here’s a concise “React rules” guide, focused on modern style and clarity over unnecessary verbosity. Think of these as guardrails for day‑to‑day coding.

---

## 1. Component & file structure

1. One main component per file, default export:

```tsx
// Button.tsx
export function Button(props: ButtonProps) {
  // ...
}
```

2. Keep components small and focused. If a file grows past ~200–300 lines, consider splitting.

3. Use function components only. No class components.

---

## 2. Props: naming and design

### 2.1 Contextual naming

- Let the component name provide context.

```tsx
// Bad
<Dialog isDialogOpen={isDialogOpen} onDialogClose={handleClose} />

// Good
<Dialog isOpen={isDialogOpen} onClose={handleClose} />
```

- Inside the parent you can stay more explicit if needed:

```tsx
const [isBillingDialogOpen, setIsBillingDialogOpen] = useState(false);

<Dialog isOpen={isBillingDialogOpen} onClose={() => setIsBillingDialogOpen(false)} />;
```

### 2.2 Avoid redundant words

- Avoid repeating meaning between prop name and value.

```tsx
// Bad
<Box colorVariable="blue-200" />

// Good
<Box color="blue-200" />
```

### 2.3 Prefer enums over boolean pairs

- Use a single discriminating prop instead of multiple boolean options.

```tsx
// Bad
<Button isPrimary isSecondary />

// Good
type ButtonVariant = "primary" | "secondary" | "ghost";

type ButtonProps = {
  variant?: ButtonVariant; // default internally
};

<Button variant="primary" />;
```

### 2.4 Avoid boolean soup

- Before adding a boolean prop, ask:
  - “Can this be derived from something else?”
  - “Does this belong in a separate component instead?”

```tsx
// Bad: extra boolean
<Dialog isClosable={false} onClose={handleClose} />

// Good: derive closability from onClose
<Dialog onClose={handleClose} />   // closable
<Dialog />                         // not closable
```

---

## 3. State & hooks

### 3.1 Prefer `useState` + `useEffect` only when necessary

- Don’t store derived values in state; derive them inline.

```tsx
// Bad
const [filtered, setFiltered] = useState(() =>
  items.filter((item) => item.visible)
);

// Good
const filtered = items.filter((item) => item.visible);
```

### 3.2 Name state clearly

```tsx
// Good
const [isOpen, setIsOpen] = useState(false);
const [query, setQuery] = useState("");
const [activeId, setActiveId] = useState<string | null>(null);
```

Avoid `value1`, `flag`, `foo`, etc.

### 3.3 `useEffect` rules

- Use `useEffect` for:
  - Syncing with external systems (DOM, APIs, subscriptions).
  - Responding to changes that must run *after* render.

- Do **not** use `useEffect` for:
  - Pure calculations (derive instead).
  - Initializing state from props (initialize in `useState`’s function).

---

## 4. TypeScript conventions

### 4.1 Props types

- Use `type` for props:

```tsx
type DialogProps = {
  isOpen: boolean;
  onClose?: () => void;
  children: React.ReactNode;
};

export function Dialog({ isOpen, onClose, children }: DialogProps) {
  // ...
}
```

### 4.2 Optional vs required

- Make handlers optional when reasonable (`onClose?`).
- Make core behavior required (`value`, `onChange` for controlled inputs).

### 4.3 Enum-like union types

```tsx
type Size = "sm" | "md" | "lg";

type AvatarProps = {
  size?: Size;
};
```

This keeps code readable and maintains autocomplete.

---

## 5. Composition over configuration

### 5.1 Prefer children composition

```tsx
// Better: JSX children
<Tabs>
  <Tabs.List>
    <Tabs.Trigger value="account">Account</Tabs.Trigger>
    <Tabs.Trigger value="billing">Billing</Tabs.Trigger>
  </Tabs.List>
  <Tabs.Content value="account">...</Tabs.Content>
  <Tabs.Content value="billing">...</Tabs.Content>
</Tabs>
```

Instead of:

```tsx
// Worse: big data prop
<Tabs
  tabs={[
    { label: "Account", key: "account", content: <Account /> },
    { label: "Billing", key: "billing", content: <Billing /> },
  ]}
/>
```

### 5.2 Compound components

Attach subcomponents for clarity:

```tsx
function TabsRoot(props: TabsProps) {
  // ...
}

function TabsList(props: TabsListProps) {
  // ...
}

function TabsTrigger(props: TabsTriggerProps) {
  // ...
}

function TabsContent(props: TabsContentProps) {
  // ...
}

export const Tabs = Object.assign(TabsRoot, {
  List: TabsList,
  Trigger: TabsTrigger,
  Content: TabsContent,
});
```

Usage:

```tsx
<Tabs value={value} onValueChange={setValue}>
  <Tabs.List>
    <Tabs.Trigger value="account">Account</Tabs.Trigger>
  </Tabs.List>
  <Tabs.Content value="account">...</Tabs.Content>
</Tabs>
```

---

## 6. Styling & classNames

### 6.1 Keep styling decisions close to components

- Accept a `className` and merge it, but don’t overdo style props.

```tsx
type ButtonProps = {
  variant?: "primary" | "secondary";
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({ variant = "primary", className, ...rest }: ButtonProps) {
  const base = "inline-flex items-center justify-center rounded-md";
  const variantClass =
    variant === "primary"
      ? "bg-blue-600 text-white"
      : "border border-gray-300 text-gray-900";

  return (
    <button className={[base, variantClass, className].filter(Boolean).join(" ")} {...rest} />
  );
}
```

---

## 7. API design heuristics

When designing a new component:

1. Start with the **minimal** API that solves the use case.
2. Prefer **one clear prop** over several interacting flags.
3. Use **unions** for modes instead of multiple mutually exclusive booleans.
4. If a prop is rarely used or very special‑case, consider:
   - A separate component, or
   - Letting callers wrap your component instead.

---

## 8. Example: “Modern, clear” component

Putting it together:

```tsx
// Dialog.tsx
type DialogProps = {
  isOpen: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  title?: string;
};

export function Dialog({ isOpen, onClose, title, children }: DialogProps) {
  if (!isOpen) return null;

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 grid place-items-center">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-lg bg-white p-4 shadow-lg">
        {title ? <h2 className="mb-2 text-lg font-semibold">{title}</h2> : null}
        <div>{children}</div>
        {onClose ? (
          <button className="mt-4 text-sm text-blue-600" onClick={onClose}>
            Close
          </button>
        ) : null}
      </div>
    </div>
  );
}
```

- Clear prop names.
- Minimal surface area.
- No unnecessary booleans.
- Composable `children`.
