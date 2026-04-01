import { supabase } from "@/lib/supabase";
import type { CustomerLocation } from "@/lib/supabase";

type DbClient = typeof supabase;

const LOCATION_FIELDS = "customer_location_id, customer_id, name, address, location, created_by, created_at";

// ---------------------------------------------------------------------------
// Fetch
// ---------------------------------------------------------------------------

export async function fetchLocationsForCustomer(
  customerId: string,
  client: DbClient = supabase,
): Promise<{ data: CustomerLocation[] | null; error: string | null }> {
  const { data, error } = await client
    .from("customer_locations")
    .select(LOCATION_FIELDS)
    .eq("customer_id", customerId)
    .order("name");
  return { data: data as CustomerLocation[] | null, error: error?.message ?? null };
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

export interface CreateCustomerLocationInput {
  customer_id: string;
  name: string;
  address: string | null;
  location: string; // EWKT e.g. "SRID=4326;POINT(lng lat)"
  created_by?: string | null;
}

export async function createCustomerLocation(
  input: CreateCustomerLocationInput,
  client: DbClient = supabase,
): Promise<{ data: CustomerLocation | null; error: string | null }> {
  const { data, error } = await client
    .from("customer_locations")
    .insert(input)
    .select(LOCATION_FIELDS)
    .single();
  return { data: data as CustomerLocation | null, error: error?.message ?? null };
}
