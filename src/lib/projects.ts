import { supabase } from "@/lib/supabase";
import type { Project } from "@/lib/supabase";

type DbClient = typeof supabase;

const PROJECT_FIELDS =
  "project_id, created_at, updated_at, created_by, organization_id, title, description, project_status, start_time, customer_id, customer_location_id, customer_location:customer_locations!customer_location_id(name, address, location)";

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

  if (filters.timeFilter === "today") {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    query = query
      .gte("start_time", start.toISOString())
      .lt("start_time", end.toISOString());
  }

  if (filters.statusFilters.length > 0) {
    query = query.in("project_status", filters.statusFilters);
  }

  if (filters.assigneeUserIds.length > 0) {
    query = query.in("project_assignees.user_id", filters.assigneeUserIds);
  }

  const { data, error } = await query;
  return { data: data as Project[] | null, error: error?.message ?? null };
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

export interface CreateProjectInput {
  title: string;
  description: string | null;
  project_status: number;
  start_time: string | null;
  customer_id: string;
  customer_location_id: string;
  organization_id: string | null;
}

export async function createProject(
  input: CreateProjectInput,
  assigneeIds: string[],
  client: DbClient = supabase,
): Promise<{ data: Project | null; error: string | null }> {
  const { data, error } = await client
    .from("projects")
    .insert({ ...input, updated_at: new Date().toISOString() })
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

  return { data: project, error: null };
}

// ---------------------------------------------------------------------------
// Update fields
// ---------------------------------------------------------------------------

export interface UpdateProjectInput {
  title?: string;
  description?: string | null;
  start_time?: string | null;
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


