import { supabase } from "@/lib/supabase";
import type { OrganizationMember } from "@/lib/supabase";

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
    .select("user_id, display_name, role")
    .eq("organization_id", organizationId);

  return { data: data as OrganizationMember[] | null, error: error?.message ?? null };
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
    .select("user_id")
    .eq("project_id", projectId);

  if (assigneeError) return { data: null, error: assigneeError.message };
  if (!assigneeRows || assigneeRows.length === 0) return { data: [], error: null };

  const userIds = assigneeRows.map((r) => r.user_id as string);

  const { data: memberRows, error: memberError } = await client
    .from("organization_members")
    .select("user_id, display_name")
    .in("user_id", userIds);

  if (memberError) return { data: null, error: memberError.message };

  return {
    data: (memberRows ?? []).map((m) => ({
      id: m.user_id as string,
      name: (m.display_name as string | null) ?? (m.user_id as string),
    })),
    error: null,
  };
}
