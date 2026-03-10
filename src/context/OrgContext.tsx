"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { supabase, type Organization } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

const STORAGE_KEY = "active_org_id";

interface OrgContextValue {
  /** All organizations the current user is a member of */
  organizations: Organization[];
  /** The currently selected organization */
  activeOrg: Organization | null;
  /** Manually select an organization */
  setActiveOrg: (org: Organization) => void;
  /** True while organizations are being fetched */
  loading: boolean;
}

const OrgContext = createContext<OrgContextValue>({
  organizations: [],
  activeOrg: null,
  setActiveOrg: () => {},
  loading: true,
});

export function OrgProvider({ children }: { children: ReactNode }) {
  const { session, loading: authLoading } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [activeOrg, setActiveOrgState] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  const setActiveOrg = useCallback((org: Organization) => {
    setActiveOrgState(org);
    localStorage.setItem(STORAGE_KEY, org.organization_id);
  }, []);

  useEffect(() => {
    // Wait for auth to resolve first
    if (authLoading) return;

    const fetchOrgs = async () => {
      if (!session) {
        setOrganizations([]);
        setActiveOrgState(null);
        setLoading(false);
        return;
      }

      setLoading(true);

      // Step 1: get the org IDs this user belongs to
      console.log("Fetching org memberships for user:", session.user.id);
      const { data: members, error: memberError } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", session.user.id);

      if (memberError) {
        console.error("Failed to fetch memberships:", memberError.message);
        setLoading(false);
        return;
      }

      const orgIds = (members ?? []).map((m) => m.organization_id as string);
      console.log("User belongs to org IDs:", orgIds);
      if (orgIds.length === 0) {
        setOrganizations([]);
        setActiveOrgState(null);
        setLoading(false);
        return;
      }

      // Step 2: fetch the organization rows
      const { data: orgs, error: orgError } = await supabase
        .from("organizations")
        .select("organization_id, name, created_at")
        .in("organization_id", orgIds);

      if (orgError) {
        console.error("Failed to fetch organizations:", orgError.message);
        setLoading(false);
        return;
      }

      const resolvedOrgs = (orgs ?? []) as Organization[];

      setOrganizations(resolvedOrgs);

      // Restore previously selected org from localStorage
      const savedId = localStorage.getItem(STORAGE_KEY);
      const savedOrg = resolvedOrgs.find((o) => o.organization_id === savedId) ?? null;

      if (savedOrg) {
        setActiveOrgState(savedOrg);
      } else if (resolvedOrgs.length === 1) {
        // Auto-select if user only belongs to one org
        setActiveOrgState(resolvedOrgs[0]);
        localStorage.setItem(STORAGE_KEY, resolvedOrgs[0].organization_id);
      } else {
        setActiveOrgState(null);
      }

      setLoading(false);
    };

    fetchOrgs();
  }, [session, authLoading]);

  return (
    <OrgContext.Provider value={{ organizations, activeOrg, setActiveOrg, loading }}>
      {children}
    </OrgContext.Provider>
  );
}

export function useOrg() {
  return useContext(OrgContext);
}
