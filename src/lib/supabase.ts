import { createClient } from "@supabase/supabase-js";

export type Project = {
  project_id: string;
  organization_id: string | null;
  created_at: string;
  created_by: string | null;
  start_time: string | null;
  expected_hours: number | null;
  project_status: number | null;
  title: string;
  // PostGIS geometry column — returned as GeoJSON by the REST API
  location: { type: "Point"; coordinates: [number, number] } | null;
};

export type Organization = {
  organization_id: string;
  created_at: string;
  name: string;
};

export type OrganizationMember = {
  organization_id: string;
  user_id: string;
  role: string | null;
  created_at: string;
  display_name: string | null;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Support both the legacy anon key and the newer publishable default key
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. " +
      "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY in your .env.local file."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
