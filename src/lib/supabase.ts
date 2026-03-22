import { createClient } from "@supabase/supabase-js";

/** Org-scoped member roles, ordered from least to most privileged. */
export type Role = "member" | "admin";

const ROLE_RANK: Record<Role, number> = { member: 0, admin: 1 };

/**
 * Returns true if `userRole` meets or exceeds the required `minRole`.
 * Use this instead of `activeRole === "admin"` so that higher-privileged roles
 * automatically inherit lower-role permissions.
 */
export function hasMinRole(userRole: string | null, minRole: Role): boolean {
  if (!userRole || !(userRole in ROLE_RANK)) return false;
  return ROLE_RANK[userRole as Role] >= ROLE_RANK[minRole];
}

/** System-level (cross-org) roles. A user with no profile row is a regular user. */
export type SystemRole = "dev";

export type Project = {
  project_id: string;
  organization_id: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  start_time: string | null;
  expected_hours: number | null;
  project_status: number | null;
  title: string;
  description: string | null;
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
  role: Role | null;
  created_at: string;
  display_name: string | null;
  hourly_rate: number | null;
};

export type TimeLogEntry = {
  id: string;
  user_id: string;
  project_id: string;
  date: string; // ISO date string (YYYY-MM-DD)
  hours: number;
  created_at: string;
  updated_at: string;
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

export type DbClient = typeof supabase;
