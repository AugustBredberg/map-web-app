import { supabase } from "@/lib/supabase";
import type { DbClient } from "@/lib/supabase";
import type { OrganizationItem, OrganizationItemKind } from "@/lib/supabase";

export type { OrganizationItem, OrganizationItemKind };

type Client = DbClient;

const ITEM_FIELDS =
  "organization_item_id, organization_id, kind, name, notes, created_at, created_by";

export async function listOrganizationItems(
  organizationId: string,
  client: Client = supabase,
): Promise<{ data: OrganizationItem[] | null; error: string | null }> {
  const { data, error } = await client
    .from("organization_items")
    .select(ITEM_FIELDS)
    .eq("organization_id", organizationId)
    .order("kind")
    .order("name");

  return { data: data as OrganizationItem[] | null, error: error?.message ?? null };
}

export interface CreateOrganizationItemInput {
  organization_id: string;
  kind: OrganizationItemKind;
  name: string;
  notes?: string | null;
}

export async function createOrganizationItem(
  input: CreateOrganizationItemInput,
  client: Client = supabase,
): Promise<{ data: OrganizationItem | null; error: string | null }> {
  const name = input.name.trim();
  if (!name) return { data: null, error: "Name is required" };

  const { data, error } = await client
    .from("organization_items")
    .insert({
      organization_id: input.organization_id,
      kind: input.kind,
      name,
      notes: input.notes?.trim() || null,
    })
    .select(ITEM_FIELDS)
    .single();

  return { data: data as OrganizationItem | null, error: error?.message ?? null };
}

export async function updateOrganizationItem(
  organizationItemId: string,
  patch: { name?: string; notes?: string | null },
  client: Client = supabase,
): Promise<{ data: OrganizationItem | null; error: string | null }> {
  const row: Record<string, unknown> = {};
  if (patch.name !== undefined) {
    const n = patch.name.trim();
    if (!n) return { data: null, error: "Name is required" };
    row.name = n;
  }
  if (patch.notes !== undefined) row.notes = patch.notes?.trim() || null;

  if (Object.keys(row).length === 0) {
    const { data: existing, error } = await client
      .from("organization_items")
      .select(ITEM_FIELDS)
      .eq("organization_item_id", organizationItemId)
      .single();
    return { data: existing as OrganizationItem | null, error: error?.message ?? null };
  }

  const { data, error } = await client
    .from("organization_items")
    .update(row)
    .eq("organization_item_id", organizationItemId)
    .select(ITEM_FIELDS)
    .single();

  return { data: data as OrganizationItem | null, error: error?.message ?? null };
}

export async function deleteOrganizationItem(
  organizationItemId: string,
  client: Client = supabase,
): Promise<{ error: string | null }> {
  const { error } = await client
    .from("organization_items")
    .delete()
    .eq("organization_item_id", organizationItemId);
  return { error: error?.message ?? null };
}

export interface ProjectItemRow {
  project_id: string;
  organization_item_id: string;
  sort_order: number;
  organization_items: OrganizationItem;
}

export async function getProjectItems(
  projectId: string,
  client: Client = supabase,
): Promise<{ data: ProjectItemRow[] | null; error: string | null }> {
  const { data, error } = await client
    .from("project_items")
    .select(`sort_order, organization_item_id, project_id, organization_items (${ITEM_FIELDS})`)
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true });

  if (error) return { data: null, error: error.message };

  const raw = (data ?? []) as unknown as (Omit<ProjectItemRow, "organization_items"> & {
    organization_items: OrganizationItem | OrganizationItem[] | null;
  })[];

  const rows: ProjectItemRow[] = raw.map((row) => {
    const oi = row.organization_items;
    const organization_items = Array.isArray(oi) ? oi[0] : oi;
    return {
      project_id: row.project_id,
      organization_item_id: row.organization_item_id,
      sort_order: row.sort_order,
      organization_items: organization_items as OrganizationItem,
    };
  });

  const deduped = [...new Map(rows.map((r) => [r.organization_item_id, r])).values()];
  return { data: deduped, error: null };
}

/**
 * Replaces all tool/material links for a project. Pass empty array to clear.
 */
export async function replaceProjectItems(
  projectId: string,
  organizationItemIds: string[],
  client: Client = supabase,
): Promise<{ error: string | null }> {
  const { error: delErr } = await client.from("project_items").delete().eq("project_id", projectId);
  if (delErr) return { error: delErr.message };

  if (organizationItemIds.length === 0) return { error: null };

  const uniqueIds = [...new Set(organizationItemIds)];

  const { error: insErr } = await client.from("project_items").insert(
    uniqueIds.map((organization_item_id, sort_order) => ({
      project_id: projectId,
      organization_item_id,
      sort_order,
    })),
  );
  return { error: insErr?.message ?? null };
}
