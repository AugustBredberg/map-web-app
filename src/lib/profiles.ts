import { supabase } from "@/lib/supabase";
import type { SignupSource, SystemRole, DbClient } from "@/lib/supabase";

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

export async function getSignupSource(
  userId: string,
  client: DbClient = supabase,
): Promise<{ data: SignupSource; error: string | null }> {
  const { data, error } = await client
    .from("profiles")
    .select("signup_source")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) return { data: "unknown", error: error.message };
  const raw = data?.signup_source as string | undefined;
  if (raw === "self_serve" || raw === "invite" || raw === "unknown") {
    return { data: raw, error: null };
  }
  return { data: "unknown", error: null };
}

/** Loads system_role and signup_source in one round trip. */
export async function getProfileFlags(
  userId: string,
  client: DbClient = supabase,
): Promise<{
  data: { systemRole: SystemRole | null; signupSource: SignupSource };
  error: string | null;
}> {
  const { data, error } = await client
    .from("profiles")
    .select("system_role, signup_source")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    return {
      data: { systemRole: null, signupSource: "unknown" },
      error: error.message,
    };
  }
  const signupRaw = data?.signup_source as string | undefined;
  const signupSource: SignupSource =
    signupRaw === "self_serve" || signupRaw === "invite" || signupRaw === "unknown"
      ? signupRaw
      : "unknown";
  return {
    data: {
      systemRole: (data?.system_role as SystemRole) ?? null,
      signupSource,
    },
    error: null,
  };
}
