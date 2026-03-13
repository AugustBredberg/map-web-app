---
description: "Use when creating or modifying Supabase data access functions in src/lib/. Covers the client injection pattern, error return shape, query chaining, and multi-step flows like assignee management."
applyTo: "src/lib/*.ts"
---
# Supabase Data Access Layer

## Client Injection Pattern

Every exported function accepts an optional `client` parameter defaulting to the shared Supabase instance. This enables unit testing with mock clients.

```typescript
import { supabase } from "@/lib/supabase";
import type { DbClient } from "@/lib/supabase";

export async function myQuery(
  id: string,
  client: DbClient = supabase,
): Promise<{ data: MyType | null; error: string | null }> {
  const { data, error } = await client
    .from("my_table")
    .select("col1, col2")
    .eq("id", id)
    .single();
  return { data: data as MyType | null, error: error?.message ?? null };
}
```

## Return Shape

All lib functions return `{ data: T | null, error: string | null }`. Convert Supabase errors to plain strings via `error?.message ?? null`. Never throw exceptions from lib functions.

## Multi-Step Flows

When a mutation involves related tables (e.g. project + assignees), perform steps sequentially and return early on error:

```typescript
// Step 1: main mutation
const { data, error } = await client.from("projects").insert(input).select(FIELDS).single();
if (error) return { data: null, error: error.message };

// Step 2: related table
if (assigneeIds.length > 0) {
  const { error: assigneeError } = await client.from("project_assignees").insert(...);
  if (assigneeError) console.error("Failed to save assignees:", assigneeError.message);
}
```

## Foreign Key Constraints

When deleting a row that has child rows in other tables, delete the children first:

```typescript
// Delete assignees before deleting the project
await client.from("project_assignees").delete().eq("project_id", projectId);
await client.from("projects").delete().eq("project_id", projectId);
```

## Types

Import types from `@/lib/supabase`. Available: `Project`, `Organization`, `OrganizationMember`, `DbClient`.

## Geometry

- Locations are stored as PostGIS geometry
- Write with WKT: `"POINT(lng lat)"` (longitude first)
- Read as GeoJSON: `{ type: "Point", coordinates: [lng, lat] }`
