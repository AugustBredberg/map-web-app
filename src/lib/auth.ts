import { supabase } from "@/lib/supabase";

type AuthClient = typeof supabase;

export async function signInWithPassword(
  email: string,
  password: string,
  client: AuthClient = supabase,
) {
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  return { data, error: error?.message ?? null };
}

export async function signUp(
  email: string,
  password: string,
  client: AuthClient = supabase,
) {
  const { data, error } = await client.auth.signUp({ email, password });
  return { data, error: error?.message ?? null };
}

export async function signOut(client: AuthClient = supabase) {
  const { error } = await client.auth.signOut();
  return { error: error?.message ?? null };
}

export async function getSession(client: AuthClient = supabase) {
  const { data, error } = await client.auth.getSession();
  return { session: data.session, error: error?.message ?? null };
}

export function onAuthStateChange(
  callback: (event: string, session: unknown) => void,
  client: AuthClient = supabase,
) {
  return client.auth.onAuthStateChange(callback as Parameters<typeof client.auth.onAuthStateChange>[0]);
}
