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

export type InvitationDetail = {
  id: number;
  organization_id: string;
  organization_name: string;
  invitee_email: string;
  expires_at: string | null;
  accepted_at: string | null;
};

export type InvitationWithOrg = Invitation & {
  organizations: { name: string } | null;
};

/**
 * Call the send-invite edge function to create an invitation row and
 * send the invite email. Must be called by an authenticated admin.
 */
export async function sendInvite(
  organizationId: string,
  inviteeEmail: string,
  invitedBy: string,
  client: DbClient = supabase,
): Promise<{ error: string | null }> {
  const { error } = await client.functions.invoke("send-invite", {
    body: { organization_id: organizationId, invitee_email: inviteeEmail, invited_by: invitedBy },
  });
  return { error: error?.message ?? null };
}

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
  _organizationId: string,
  _userId: string,
  displayName: string,
  client: DbClient = supabase,
): Promise<{ error: string | null }> {
  const { error } = await client.rpc("accept_invitation_by_id", {
    p_invitation_id: invitationId,
    p_display_name: displayName,
  });

  return { error: error?.message ?? null };
}

/**
 * Look up an invitation by its UUID token. Accessible without authentication
 * (public RLS policy required — see Supabase setup guide).
 */
export async function getInvitationByToken(
  token: string,
  client: DbClient = supabase,
): Promise<{ data: InvitationDetail | null; error: string | null }> {
  const { data, error } = await client
    .rpc("get_invitation_by_token", { p_token: token })
    .single();

  if (error || !data) return { data: null, error: error?.message ?? "Invitation not found" };

  const row = data as {
    id: number;
    organization_id: string;
    organization_name: string;
    invitee_email: string;
    expires_at: string | null;
    accepted_at: string | null;
  };

  if (row.expires_at && new Date(row.expires_at) < new Date()) {
    return { data: null, error: "Invitation has expired" };
  }

  return {
    data: {
      id: row.id,
      organization_id: row.organization_id,
      organization_name: row.organization_name ?? "Unknown organization",
      invitee_email: row.invitee_email,
      expires_at: row.expires_at,
      accepted_at: row.accepted_at,
    },
    error: null,
  };
}

/**
 * Accept an invitation by token for an already-authenticated user.
 * Delegates to a SECURITY DEFINER RPC so no direct-table RLS policies are needed.
 * The RPC validates that the invitation email matches auth.email() server-side.
 */
export async function acceptInvitationByToken(
  token: string,
  _userId: string,
  displayName: string,
  client: DbClient = supabase,
): Promise<{ error: string | null }> {
  const { error } = await client.rpc("accept_invitation_by_token", {
    p_token: token,
    p_display_name: displayName,
  });

  return { error: error?.message ?? null };
}
