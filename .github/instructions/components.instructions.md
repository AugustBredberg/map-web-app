---
description: "Use when creating or modifying React components in src/components/ or src/context/. Covers component structure, context patterns, drawer usage, HeroUI conventions, and role-based UI."
applyTo: "src/components/**, src/context/**"
---
# React Components & Context

## Component Structure

Every component and context file starts with `"use client"`. Use default exports for components.

```typescript
"use client";

import { useState } from "react";
import { Button } from "@heroui/react";

export default function MyComponent() {
  return <Button color="primary">Click</Button>;
}
```

## HeroUI Usage

- Import all UI components from `@heroui/react` (Button, Input, Select, SelectItem, Modal, Spinner, etc.)
- Use `variant="bordered"` for form inputs
- Use `color="primary"` for main actions, `color="danger"` for destructive actions
- Use `isDisabled`, `isLoading` props for state feedback
- Select components use `selectedKeys` as a `Set` and `onSelectionChange` with key extraction

## Context Pattern

All contexts follow the same structure:

1. Define a TypeScript interface for the context value
2. Create context with `createContext` using sensible defaults
3. Create a `Provider` component with state and memoized callbacks
4. Export a `useXxx()` hook via `useContext`

```typescript
const MyContext = createContext<MyContextValue>({ /* defaults */ });

export function MyProvider({ children }: { children: ReactNode }) {
  // state, callbacks...
  return <MyContext.Provider value={{ ... }}>{children}</MyContext.Provider>;
}

export function useMy() {
  return useContext(MyContext);
}
```

Use `useCallback` for all functions exposed through context. Use `useRef` for callback registrations that shouldn't trigger re-renders (e.g. `onProjectSaved`, `onClose`).

## Drawer Pattern

The app uses a single `DrawerContext` for sliding panels. To show content in the drawer:

```typescript
const { openDrawer, closeDrawer } = useDrawer();
openDrawer(<MyContent />, { title: "Panel Title", backdrop: false, onClose: cleanup });
```

## Role-Based UI

There are two separate role concepts:

**Org-scoped roles** (`"member" | "admin"`) — stored in `organization_members.role`, accessed via `useOrg()`. Gate UI with `hasMinRole()`:

```typescript
import { hasMinRole } from "@/lib/supabase";
const { activeRole } = useOrg();
if (hasMinRole(activeRole, "admin")) { /* admin + any higher role */ }
```

**System roles** (`"dev"`) — cross-org, stored in the `profiles` table, accessed via `useAuth()`. Used for platform-level capabilities like creating organizations:

```typescript
const { systemRole } = useAuth();
if (systemRole === "dev") { /* dev-only UI */ }
```

Never use raw string comparisons for org roles like `activeRole === "admin"`. Always use `hasMinRole`.

## Guard Components

- `AuthGuard` — redirects to `/login` if no session
- `OrgGuard` — redirects to `/settings` if no active organization

These wrap pages in layout files, not individual components.
