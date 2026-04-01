import { supabase } from "@/lib/supabase";
import type { Project } from "@/lib/supabase";
import { replaceProjectItems } from "@/lib/organizationItems";
import { projectMatchesTodaysJobsFilter } from "@/lib/projectSchedule";

type DbClient = typeof supabase;

const PROJECT_FIELDS =
  "project_id, created_at, updated_at, created_by, organization_id, title, description, project_status, schedule_kind, schedule_window_start, schedule_window_end, schedule_appointment_at, customer_id, customer_location_id, customer:customers!customer_id(name, phone, email), customer_location:customer_locations!customer_location_id(name, address, location)";

// ---------------------------------------------------------------------------
// Fetch
// ---------------------------------------------------------------------------

export interface ProjectFetchFilters {
  timeFilter: "today" | "all" | null;
  statusFilters: number[];
  assigneeUserIds: string[];
}

export async function fetchProjects(
  orgId: string,
  filters: ProjectFetchFilters = { timeFilter: "all", statusFilters: [], assigneeUserIds: [] },
  client: DbClient = supabase,
): Promise<{ data: Project[] | null; error: string | null }> {
  const selectFields =
    filters.assigneeUserIds.length > 0
      ? `${PROJECT_FIELDS}, project_assignees!inner(user_id)`
      : PROJECT_FIELDS;

  let query = client
    .from("projects")
    .select(selectFields)
    .eq("organization_id", orgId);

  // "Today's jobs" is schedule-aware (ASAP always, windows overlapping today, appointments today).
  // Applied client-side after fetch — see below.

  if (filters.statusFilters.length > 0) {
    query = query.in("project_status", filters.statusFilters);
  }

  if (filters.assigneeUserIds.length > 0) {
    query = query.in("project_assignees.user_id", filters.assigneeUserIds);
  }

  const { data, error } = await query;
  if (error) return { data: null, error: error.message };

  let rows = data as unknown as Project[] | null;
  if (filters.timeFilter === "today" && rows) {
    rows = rows.filter((p) => projectMatchesTodaysJobsFilter(p));
  }

  return { data: rows, error: null };
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

export interface CreateProjectInput {
  title: string;
  description: string | null;
  project_status: number;
  schedule_kind: "asap" | "window" | "appointment";
  schedule_window_start: string | null;
  schedule_window_end: string | null;
  schedule_appointment_at: string | null;
  customer_id: string;
  customer_location_id: string;
  organization_id: string | null;
  /** Optional catalog item IDs (tools/materials) to attach after the project is created. */
  organization_item_ids?: string[];
}

export async function createProject(
  input: CreateProjectInput,
  assigneeIds: string[],
  client: DbClient = supabase,
): Promise<{ data: Project | null; error: string | null }> {
  const { organization_item_ids: itemIds = [], ...projectRow } = input;

  const { data, error } = await client
    .from("projects")
    .insert({ ...projectRow, updated_at: new Date().toISOString() })
    .select(PROJECT_FIELDS)
    .single();

  if (error) return { data: null, error: error.message };

  const project = data as unknown as Project;

  if (assigneeIds.length > 0) {
    const { error: assigneeError } = await client.from("project_assignees").insert(
      assigneeIds.map((userId) => ({
        project_id: project.project_id,
        user_id: userId,
        organization_id: input.organization_id,
      })),
    );
    if (assigneeError) {
      console.error("Failed to save assignees:", assigneeError.message);
    }
  }

  if (itemIds.length > 0) {
    const { error: itemsError } = await replaceProjectItems(project.project_id, itemIds, client);
    if (itemsError) {
      console.error("Failed to save project tools/materials:", itemsError);
    }
  }

  return { data: project, error: null };
}

// ---------------------------------------------------------------------------
// Update fields
// ---------------------------------------------------------------------------

export interface UpdateProjectInput {
  title?: string;
  description?: string | null;
  schedule_kind?: "asap" | "window" | "appointment";
  schedule_window_start?: string | null;
  schedule_window_end?: string | null;
  schedule_appointment_at?: string | null;
}

export async function updateProject(
  projectId: string,
  input: UpdateProjectInput,
  client: DbClient = supabase,
): Promise<{ data: Project | null; error: string | null }> {
  const { data, error } = await client
    .from("projects")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("project_id", projectId)
    .select(PROJECT_FIELDS)
    .single();
  return { data: data as Project | null, error: error?.message ?? null };
}

// ---------------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------------

export async function deleteProject(
  projectId: string,
  client: DbClient = supabase,
): Promise<{ error: string | null }> {
  const { error } = await client
    .from("projects")
    .delete()
    .eq("project_id", projectId);
  return { error: error?.message ?? null };
}

// ---------------------------------------------------------------------------
// Update status
// ---------------------------------------------------------------------------

export async function updateProjectStatus(
  projectId: string,
  status: number,
  client: DbClient = supabase,
): Promise<{ data: Project | null; error: string | null }> {
  const { data, error } = await client
    .from("projects")
    .update({ project_status: status, updated_at: new Date().toISOString() })
    .eq("project_id", projectId)
    .select(PROJECT_FIELDS)
    .single();
  return { data: data as Project | null, error: error?.message ?? null };
}


