import { supabase } from "@/lib/supabase";
import type { DbClient } from "@/lib/supabase";

export type Invitation = {
  id: number;
  organization_id: string;
  invitee_email: string;
  invited_by: string;
  created_at: string;
  accepted_at: string | null;
};

export type InvitationWithOrg = Invitation & {
  organizations: { name: string } | null;
};

export async function createInvitation(
  organizationId: string,
  inviteeEmail: string,
  invitedBy: string,
  client: DbClient = supabase,
): Promise<{ data: Invitation | null; error: string | null }> {
  const { data, error } = await client
    .from("organization_invitations")
    .insert({ organization_id: organizationId, invitee_email: inviteeEmail, invited_by: invitedBy })
    .select("id, organization_id, invitee_email, invited_by, created_at, accepted_at")
    .single();
  return { data: data as Invitation | null, error: error?.message ?? null };
}

export async function getOrgInvitations(
  organizationId: string,
  client: DbClient = supabase,
): Promise<{ data: Invitation[] | null; error: string | null }> {
  const { data, error } = await client
    .from("organization_invitations")
    .select("id, organization_id, invitee_email, invited_by, created_at, accepted_at")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });
  return { data: data as Invitation[] | null, error: error?.message ?? null };
}

export async function cancelInvitation(
  id: number,
  client: DbClient = supabase,
): Promise<{ error: string | null }> {
  const { error } = await client
    .from("organization_invitations")
    .delete()
    .eq("id", id);
  return { error: error?.message ?? null };
}

export async function getMyInvitations(
  email: string,
  client: DbClient = supabase,
): Promise<{ data: InvitationWithOrg[] | null; error: string | null }> {
  const { data: rows, error } = await client
    .from("organization_invitations")
    .select("id, organization_id, invitee_email, invited_by, created_at, accepted_at")
    .eq("invitee_email", email)
    .is("accepted_at", null);

  if (error) return { data: null, error: error.message };
  if (!rows || rows.length === 0) return { data: [], error: null };

  const orgIds = [...new Set(rows.map((r) => r.organization_id as string))];
  const { data: orgs } = await client
    .from("organizations")
    .select("organization_id, name")
    .in("organization_id", orgIds);

  const orgMap = new Map((orgs ?? []).map((o) => [o.organization_id as string, o.name as string]));

  return {
    data: rows.map((r) => ({
      ...(r as Invitation),
      organizations: { name: orgMap.get(r.organization_id as string) ?? "Unknown organization" },
    })),
    error: null,
  };
}

export async function acceptInvitation(
  invitationId: number,
  organizationId: string,
  userId: string,
  displayName: string,
  client: DbClient = supabase,
): Promise<{ error: string | null }> {
  const { error: memberError } = await client
    .from("organization_members")
    .insert({ organization_id: organizationId, user_id: userId, role: "member", display_name: displayName });

  // 23505 = unique_violation: user is already a member — treat as success
  if (memberError && memberError.code !== "23505") {
    console.error("[acceptInvitation] insert member error:", memberError);
    return { error: memberError.message };
  }

  const { error: deleteError } = await client
    .from("organization_invitations")
    .delete()
    .eq("id", invitationId);

  return { error: deleteError?.message ?? null };
}
