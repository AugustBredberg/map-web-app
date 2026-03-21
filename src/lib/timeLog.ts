import { supabase } from "@/lib/supabase";
import type { TimeLogEntry, DbClient } from "@/lib/supabase";

const TIME_LOG_FIELDS = "id, user_id, project_id, date, hours, created_at, updated_at";

// ---------------------------------------------------------------------------
// Fetch entries for a project + user within a date range (e.g. one week)
// ---------------------------------------------------------------------------

export async function getTimeLogEntries(
  projectId: string,
  userId: string,
  dateFrom: string,
  dateTo: string,
  client: DbClient = supabase,
): Promise<{ data: TimeLogEntry[] | null; error: string | null }> {
  const { data, error } = await client
    .from("project_time_log_entries")
    .select(TIME_LOG_FIELDS)
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .gte("date", dateFrom)
    .lte("date", dateTo);

  return { data: data as TimeLogEntry[] | null, error: error?.message ?? null };
}

// ---------------------------------------------------------------------------
// Upsert a single day's hours (insert or update by project_id + user_id + date)
// ---------------------------------------------------------------------------

export async function upsertTimeLogEntry(
  projectId: string,
  userId: string,
  date: string,
  hours: number,
  client: DbClient = supabase,
): Promise<{ data: TimeLogEntry | null; error: string | null }> {
  const now = new Date().toISOString();

  // Check whether a row already exists for this project/user/date
  const { data: existing, error: fetchError } = await client
    .from("project_time_log_entries")
    .select("id")
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .eq("date", date)
    .maybeSingle();

  if (fetchError) return { data: null, error: fetchError.message };

  if (existing) {
    // Update existing row
    const { data, error } = await client
      .from("project_time_log_entries")
      .update({ hours, updated_at: now })
      .eq("id", existing.id)
      .select(TIME_LOG_FIELDS)
      .single();
    return { data: data as TimeLogEntry | null, error: error?.message ?? null };
  }

  // Insert new row
  const { data, error } = await client
    .from("project_time_log_entries")
    .insert({ project_id: projectId, user_id: userId, date, hours, updated_at: now })
    .select(TIME_LOG_FIELDS)
    .single();
  return { data: data as TimeLogEntry | null, error: error?.message ?? null };
}

// ---------------------------------------------------------------------------
// Delete a single entry by id
// ---------------------------------------------------------------------------

export async function deleteTimeLogEntry(
  id: string,
  client: DbClient = supabase,
): Promise<{ error: string | null }> {
  const { error } = await client
    .from("project_time_log_entries")
    .delete()
    .eq("id", id);

  return { error: error?.message ?? null };
}
