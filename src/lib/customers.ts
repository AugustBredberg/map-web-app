import { supabase } from "@/lib/supabase";
import type { Customer } from "@/lib/supabase";

type DbClient = typeof supabase;

/** Shared column list for `customers` selects (keep in sync with `Customer` in supabase.ts). */
export const CUSTOMER_FIELDS = "customer_id, name, phone, email, notes, organization_id, created_at";

/** Sentinel for UI to map to i18n when update matched zero rows (RLS, wrong id, or type mismatch). */
export const CUSTOMER_CONTACT_UPDATE_NO_MATCH = "CUSTOMER_CONTACT_UPDATE_NO_MATCH";

/**
 * PostgREST / Supabase: filtering `bigint` primary keys is reliable with a JSON number when the value
 * fits in JS safe integer range; string filters can match zero rows depending on server casting.
 */
function customerIdForEqFilter(id: string | number): string | number {
  if (typeof id === "number" && Number.isFinite(id)) return id;
  const s = String(id).trim();
  if (/^-?\d+$/.test(s)) {
    const n = Number(s);
    if (Number.isSafeInteger(n)) return n;
  }
  return s;
}

function normalizeCustomerRow(row: Customer): Customer {
  return {
    ...row,
    customer_id: String(row.customer_id),
  };
}

// ---------------------------------------------------------------------------
// Fetch
// ---------------------------------------------------------------------------

export async function fetchCustomers(
  orgId: string,
  searchTerm?: string,
  client: DbClient = supabase,
): Promise<{ data: Customer[] | null; error: string | null }> {
  let query = client
    .from("customers")
    .select(CUSTOMER_FIELDS)
    .eq("organization_id", orgId)
    .order("name");

  if (searchTerm?.trim()) {
    query = query.ilike("name", `%${searchTerm.trim()}%`);
  }

  const { data, error } = await query;
  return { data: data as Customer[] | null, error: error?.message ?? null };
}

/** Fetch all customers with their locations nested — used for nearby customer detection. */
export async function fetchCustomersWithLocations(
  orgId: string,
  client: DbClient = supabase,
): Promise<{
  data: (Customer & { customer_locations: { customer_location_id: string; name: string; address: string | null; location: { type: "Point"; coordinates: [number, number] } | null }[] })[] | null;
  error: string | null;
}> {
  const { data, error } = await client
    .from("customers")
    .select(`${CUSTOMER_FIELDS}, customer_locations(customer_location_id, name, address, location)`)
    .eq("organization_id", orgId)
    .order("name");

  return { data: data as never, error: error?.message ?? null };
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

export interface CreateCustomerInput {
  name: string;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
  organization_id: string | null;
}

export async function createCustomer(
  input: CreateCustomerInput,
  client: DbClient = supabase,
): Promise<{ data: Customer | null; error: string | null }> {
  const { data, error } = await client
    .from("customers")
    .insert(input)
    .select(CUSTOMER_FIELDS)
    .single();
  return { data: data as Customer | null, error: error?.message ?? null };
}

// ---------------------------------------------------------------------------
// Update (contact fields)
// ---------------------------------------------------------------------------

export interface UpdateCustomerContactInput {
  phone: string | null;
  email: string | null;
  notes: string | null;
}

export async function updateCustomerContact(
  customerId: string | number,
  input: UpdateCustomerContactInput,
  client: DbClient = supabase,
): Promise<{ data: Customer | null; error: string | null }> {
  const pk = customerIdForEqFilter(customerId);
  const payload = {
    phone: input.phone?.trim() || null,
    email: input.email?.trim() || null,
    notes: input.notes?.trim() || null,
  };

  const { data, error } = await client
    .from("customers")
    .update(payload)
    .eq("customer_id", pk)
    .select(CUSTOMER_FIELDS)
    .maybeSingle();

  if (error) {
    return { data: null, error: error.message };
  }
  if (!data) {
    return { data: null, error: CUSTOMER_CONTACT_UPDATE_NO_MATCH };
  }
  return { data: normalizeCustomerRow(data as Customer), error: null };
}
