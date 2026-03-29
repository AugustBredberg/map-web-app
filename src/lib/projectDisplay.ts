import type { Project, ProjectCustomer } from "@/lib/supabase";

/** PostgREST may return a single object or a one-element array for embedded resources. */
export function normalizeCustomerJoin(project: Project): ProjectCustomer | null {
  const c = project.customer;
  if (!c) return null;
  if (Array.isArray(c)) return c[0] ?? null;
  return c;
}
