import { supabase } from "@/lib/supabase";
import type { Project } from "@/lib/supabase";

type DbClient = typeof supabase;

const PROJECT_FIELDS =
  "project_id, created_at, created_by, organization_id, title, location, project_status, start_time";

// ---------------------------------------------------------------------------
// Fetch
// ---------------------------------------------------------------------------

export async function fetchProjects(
  client: DbClient = supabase,
): Promise<{ data: Project[] | null; error: string | null }> {
  const { data, error } = await client.from("projects").select(PROJECT_FIELDS);
  return { data: data as Project[] | null, error: error?.message ?? null };
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

export interface CreateProjectInput {
  title: string;
  project_status: number;
  start_time: string | null;
  location: string; // WKT e.g. "POINT(lng lat)"
  organization_id: string | null;
}

export async function createProject(
  input: CreateProjectInput,
  assigneeIds: string[],
  client: DbClient = supabase,
): Promise<{ data: Project | null; error: string | null }> {
  const { data, error } = await client
    .from("projects")
    .insert(input)
    .select(PROJECT_FIELDS)
    .single();

  if (error) return { data: null, error: error.message };

  const project = data as Project;

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
// Update
// ---------------------------------------------------------------------------

export interface UpdateProjectInput {
  title: string;
  project_status: number;
  start_time: string | null;
  location: string; // WKT e.g. "POINT(lng lat)"
}

export async function updateProject(
  projectId: string,
  input: UpdateProjectInput,
  assigneeIds: string[],
  organizationId: string | null,
  client: DbClient = supabase,
): Promise<{ data: Project | null; error: string | null }> {
  const { data, error } = await client
    .from("projects")
    .update(input)
    .eq("project_id", projectId)
    .select(PROJECT_FIELDS)
    .single();

  if (error) return { data: null, error: error.message };

  const project = data as Project;

  // Replace assignees: wipe then re-insert
  await client.from("project_assignees").delete().eq("project_id", projectId);

  if (assigneeIds.length > 0) {
    const { error: assigneeError } = await client.from("project_assignees").insert(
      assigneeIds.map((userId) => ({
        project_id: projectId,
        user_id: userId,
        organization_id: organizationId,
      })),
    );
    if (assigneeError) {
      console.error("Failed to update assignees:", assigneeError.message);
    }
  }

  return { data: project, error: null };
}

// ---------------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------------

export async function deleteProject(
  projectId: string,
  client: DbClient = supabase,
): Promise<{ error: string | null }> {
  const { error: assigneesError } = await client
    .from("project_assignees")
    .delete()
    .eq("project_id", projectId);

  if (assigneesError) return { error: assigneesError.message };

  const { error } = await client
    .from("projects")
    .delete()
    .eq("project_id", projectId);
  return { error: error?.message ?? null };
}
