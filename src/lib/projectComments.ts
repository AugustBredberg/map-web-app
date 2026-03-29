import { supabase } from "@/lib/supabase";
import type { DbClient } from "@/lib/supabase";

export type ProjectComment = {
  id: string;
  project_id: string;
  body: string;
  created_by: string;
  author_display_name: string | null;
  created_at: string;
  updated_at: string;
};

const COMMENT_FIELDS = "id, project_id, body, created_by, author_display_name, created_at, updated_at";

export async function fetchProjectComments(
  projectId: string,
  client: DbClient = supabase,
): Promise<{ data: ProjectComment[] | null; error: string | null }> {
  const { data, error } = await client
    .from("project_comments")
    .select(COMMENT_FIELDS)
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  return { data: data as ProjectComment[] | null, error: error?.message ?? null };
}

export async function addProjectComment(
  projectId: string,
  body: string,
  client: DbClient = supabase,
): Promise<{ data: ProjectComment | null; error: string | null }> {
  const trimmed = body.trim();
  if (!trimmed) {
    return { data: null, error: "empty" };
  }

  const { data, error } = await client
    .from("project_comments")
    .insert({ project_id: projectId, body: trimmed })
    .select(COMMENT_FIELDS)
    .single();

  return { data: data as ProjectComment | null, error: error?.message ?? null };
}
