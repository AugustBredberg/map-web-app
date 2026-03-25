import { supabase } from "@/lib/supabase";
import type { Customer } from "@/lib/supabase";

type DbClient = typeof supabase;

const CUSTOMER_FIELDS = "customer_id, name, phone, email, notes, organization_id, created_at";

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
