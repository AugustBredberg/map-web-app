---
description: "Use when writing or modifying unit tests in src/lib/__tests__/. Covers mock client usage, test structure, and assertion patterns for Supabase data access functions."
applyTo: "src/lib/__tests__/**"
---
# Unit Testing

## Framework

Tests use **Vitest** with imports from `vitest` (describe, it, expect, vi). Tests run in Node.js environment (not jsdom).

## Mock Client

Use the shared mock client from `./mockClient`:

- `mockClient(response)` — single response for all `.from()` calls
- `mockClientSequence([r1, r2, ...])` — different response per successive `.from()` call

```typescript
import { mockClient, mockClientSequence } from "./mockClient";

// Single call
const client = mockClient({ data: [item], error: null });
const { data, error } = await fetchItems(client);

// Multi-step (e.g. insert + assign)
const client = mockClientSequence([
  { data: createdItem, error: null },  // main insert
  { data: null, error: null },          // related insert
]);
```

## Test Structure

- One `describe` block per exported function
- Two tests minimum: success case + error case
- Verify the correct Supabase table was queried via `expect(client.from).toHaveBeenCalledWith("table_name")`
- For multi-step flows, verify call count: `expect(client.from).toHaveBeenCalledTimes(2)`

## Sample Data

Define sample objects at the top of the file matching the types from `@/lib/supabase`:

```typescript
const sampleProject = {
  project_id: "p1",
  organization_id: "org1",
  created_at: "2025-01-01T00:00:00Z",
  created_by: "user1",
  start_time: null,
  expected_hours: null,
  project_status: 0,
  title: "Test Project",
  location: { type: "Point" as const, coordinates: [11.97, 57.70] as [number, number] },
};
```

## Running Tests

```
npx vitest run                          # all tests
npx vitest run src/lib/__tests__/<file> # specific file
```

## End-to-end (Playwright)

- Specs live in `e2e/`. **Unauthenticated** flows: `e2e/*.spec.ts` (run with `npm run test:e2e`).
- **Authenticated** flows: `e2e/authenticated/*.spec.ts` run only when `E2E_LOCAL_SUPABASE=1` (use `npm run test:e2e:local`). Requires Docker, `npm run supabase:db:reset`, and `.env.e2e` from `.env.e2e.example` (including `NEXT_PUBLIC_MAPTILER_KEY`).
- Auth setup saves storage to `playwright/.auth/` (gitignored); `e2e/auth.setup.ts` logs in as `dev@seed.kartapp.test` (see `supabase/seed.sql`).
