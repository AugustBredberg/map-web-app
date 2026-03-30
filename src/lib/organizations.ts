import { supabase } from "@/lib/supabase";
import type { Organization, OrganizationMember, DbClient } from "@/lib/supabase";

export async function getMembershipsByUserId(
  userId: string,
  client: DbClient = supabase,
): Promise<{ data: OrganizationMember[] | null; error: string | null }> {
  const { data, error } = await client
    .from("organization_members")
    .select("organization_id, user_id, role, created_at, display_name")
    .eq("user_id", userId);

  return { data: data as OrganizationMember[] | null, error: error?.message ?? null };
}

export async function getOrganizationsByIds(
  orgIds: string[],
  client: DbClient = supabase,
): Promise<{ data: Organization[] | null; error: string | null }> {
  const { data, error } = await client
    .from("organizations")
    .select("organization_id, name, created_at")
    .in("organization_id", orgIds);

  return { data: data as Organization[] | null, error: error?.message ?? null };
}

export async function getAllOrganizations(
  client: DbClient = supabase,
): Promise<{ data: Organization[] | null; error: string | null }> {
  const { data, error } = await client
    .from("organizations")
    .select("organization_id, name, created_at")
    .order("name");

  return { data: data as Organization[] | null, error: error?.message ?? null };
}

export async function createOrganization(
  name: string,
  client: DbClient = supabase,
): Promise<{ data: Organization | null; error: string | null }> {
  const { data, error } = await client
    .from("organizations")
    .insert({ name })
    .select("organization_id, name, created_at")
    .single();

  if (error) return { data: null, error: error.message };
  return { data: data as Organization, error: null };
}

/**
 * Self-serve founders only — enforced by create_organization_for_self_serve RPC
 * (confirmed email, signup_source = self_serve, no existing membership).
 */
export async function createOrganizationForSelfServe(
  name: string,
  client: DbClient = supabase,
): Promise<{ data: { organization_id: string } | null; error: string | null }> {
  const { data, error } = await client.rpc("create_organization_for_self_serve", {
    p_name: name,
  });

  if (error) return { data: null, error: error.message };
  return { data: { organization_id: data as string }, error: null };
}
