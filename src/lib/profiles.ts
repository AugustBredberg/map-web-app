import { supabase } from "@/lib/supabase";
import type { SystemRole, DbClient } from "@/lib/supabase";

export async function getSystemRole(
  userId: string,
  client: DbClient = supabase,
): Promise<{ data: SystemRole | null; error: string | null }> {
  const { data, error } = await client
    .from("profiles")
    .select("system_role")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) return { data: null, error: error.message };
  return { data: (data?.system_role as SystemRole) ?? null, error: null };
}
