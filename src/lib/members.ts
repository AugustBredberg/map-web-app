import { supabase } from "@/lib/supabase";
import type { OrganizationMember, Role } from "@/lib/supabase";

type DbClient = typeof supabase;

// ---------------------------------------------------------------------------
// Org members (used by the assignees picker in the project form)
// ---------------------------------------------------------------------------

export async function getOrgMembers(
  organizationId: string,
  client: DbClient = supabase,
): Promise<{ data: OrganizationMember[] | null; error: string | null }> {
  const { data, error } = await client
    .from("organization_members")
    .select("user_id, display_name, role, hourly_rate")
    .eq("organization_id", organizationId);

  return { data: data as OrganizationMember[] | null, error: error?.message ?? null };
}

export async function updateMemberRole(
  organizationId: string,
  userId: string,
  role: Role,
  client: DbClient = supabase,
): Promise<{ error: string | null }> {
  const { error } = await client
    .from("organization_members")
    .update({ role })
    .eq("organization_id", organizationId)
    .eq("user_id", userId);
  return { error: error?.message ?? null };
}

export async function updateMemberHourlyRate(
  organizationId: string,
  userId: string,
  hourlyRate: number | null,
  client: DbClient = supabase,
): Promise<{ error: string | null }> {
  const { error } = await client
    .from("organization_members")
    .update({ hourly_rate: hourlyRate })
    .eq("organization_id", organizationId)
    .eq("user_id", userId);
  return { error: error?.message ?? null };
}

// ---------------------------------------------------------------------------
// Project assignees (used by ProjectDetailsPanel to display names)
// ---------------------------------------------------------------------------

export interface AssigneeWithName {
  id: string;
  name: string;
}

export async function getProjectAssignees(
  projectId: string,
  client: DbClient = supabase,
): Promise<{ data: AssigneeWithName[] | null; error: string | null }> {
  const { data: assigneeRows, error: assigneeError } = await client
    .from("project_assignees")
    .select("user_id, organization_id")
    .eq("project_id", projectId);

  if (assigneeError) return { data: null, error: assigneeError.message };
  if (!assigneeRows || assigneeRows.length === 0) return { data: [], error: null };

  // Defensive: one row per user even if project_assignees ever contained duplicates.
  const assigneeRowsUnique = [...new Map(assigneeRows.map((r) => [r.user_id as string, r])).values()];

  const userIds = assigneeRowsUnique.map((r) => r.user_id as string);
  // All assignees belong to the same org; use the first row's org_id to
  // constrain the member lookup and avoid picking up display names from
  // a different organization for users who belong to multiple orgs.
  const organizationId = assigneeRowsUnique[0].organization_id as string;

  const { data: memberRows, error: memberError } = await client
    .from("organization_members")
    .select("user_id, display_name")
    .eq("organization_id", organizationId)
    .in("user_id", userIds);

  if (memberError) return { data: null, error: memberError.message };

  const seen = new Set<string>();
  const unique = (memberRows ?? []).filter((m) => {
    const id = m.user_id as string;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });

  return {
    data: unique.map((m) => ({
      id: m.user_id as string,
      name: (m.display_name as string | null) ?? (m.user_id as string),
    })),
    error: null,
  };
}

// ---------------------------------------------------------------------------
// Set project assignees (replaces all existing assignees)
// ---------------------------------------------------------------------------

export async function setProjectAssignees(
  projectId: string,
  organizationId: string,
  userIds: string[],
  client: DbClient = supabase,
): Promise<{ error: string | null }> {
  const { error: deleteError } = await client
    .from("project_assignees")
    .delete()
    .eq("project_id", projectId);

  if (deleteError) return { error: deleteError.message };

  if (userIds.length > 0) {
    const { error: insertError } = await client.from("project_assignees").insert(
      userIds.map((userId) => ({ project_id: projectId, user_id: userId, organization_id: organizationId })),
    );
    if (insertError) return { error: insertError.message };
  }

  return { error: null };
}
