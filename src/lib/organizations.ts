import { supabase } from "@/lib/supabase";
import type { Organization, OrganizationMember } from "@/lib/supabase";

type DbClient = typeof supabase;

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
