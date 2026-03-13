"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { Organization, OrganizationMember } from "@/lib/supabase";
import { getMembershipsByUserId, getOrganizationsByIds } from "@/lib/organizations";
import { useAuth } from "@/context/AuthContext";

const STORAGE_KEY = "active_org_id";

interface OrgContextValue {
  /** All organizations the current user is a member of */
  organizations: Organization[];
  /** The currently selected organization */
  activeOrg: Organization | null;
  /** The current user's role in the active organization */
  activeRole: string | null;
  /** The current user's display name in the active organization */
  displayName: string | null;
  /** Manually select an organization */
  setActiveOrg: (org: Organization) => void;
  /** True while organizations are being fetched */
  loading: boolean;
}

const OrgContext = createContext<OrgContextValue>({
  organizations: [],
  activeOrg: null,
  activeRole: null,
  displayName: null,
  setActiveOrg: () => {},
  loading: true,
});

export function OrgProvider({ children }: { children: ReactNode }) {
  const { session, loading: authLoading } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [activeOrg, setActiveOrgState] = useState<Organization | null>(null);
  const [activeRole, setActiveRole] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [memberships, setMemberships] = useState<OrganizationMember[]>([]);
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
        setActiveRole(null);
        setDisplayName(null);
        setMemberships([]);
        setLoading(false);
        return;
      }

      setLoading(true);

      // Step 1: get the org memberships (including role) for this user
      console.log("Fetching org memberships for user:", session.user.id);
      const { data: members, error: memberError } = await getMembershipsByUserId(session.user.id);

      if (memberError) {
        console.error("Failed to fetch memberships:", memberError);
        setLoading(false);
        return;
      }

      const resolvedMembers = (members ?? []) as OrganizationMember[];
      setMemberships(resolvedMembers);
      const orgIds = resolvedMembers.map((m) => m.organization_id);
      console.log("User belongs to org IDs:", orgIds);
      if (orgIds.length === 0) {
        setOrganizations([]);
        setActiveOrgState(null);
        setActiveRole(null);
        setDisplayName(null);
        setLoading(false);
        return;
      }

      // Step 2: fetch the organization rows
      const { data: orgs, error: orgError } = await getOrganizationsByIds(orgIds);

      if (orgError) {
        console.error("Failed to fetch organizations:", orgError);
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
        const m = resolvedMembers.find((m) => m.organization_id === savedOrg.organization_id);
        setActiveRole(m?.role ?? null);
        setDisplayName(m?.display_name ?? null);
      } else if (resolvedOrgs.length === 1) {
        // Auto-select if user only belongs to one org
        setActiveOrgState(resolvedOrgs[0]);
        const m = resolvedMembers.find((m) => m.organization_id === resolvedOrgs[0].organization_id);
        setActiveRole(m?.role ?? null);
        setDisplayName(m?.display_name ?? null);
        localStorage.setItem(STORAGE_KEY, resolvedOrgs[0].organization_id);
      } else {
        setActiveOrgState(null);
        setActiveRole(null);
        setDisplayName(null);
      }

      setLoading(false);
    };

    fetchOrgs();
  }, [session, authLoading]);

  // Keep activeRole in sync when setActiveOrg is called manually (e.g. from settings)
  const setActiveOrgWithRole = useCallback((org: Organization) => {
    setActiveOrg(org);
    const m = memberships.find((m) => m.organization_id === org.organization_id);
    setActiveRole(m?.role ?? null);
    setDisplayName(m?.display_name ?? null);
  }, [setActiveOrg, memberships]);

  return (
    <OrgContext.Provider value={{ organizations, activeOrg, activeRole, displayName, setActiveOrg: setActiveOrgWithRole, loading }}>
      {children}
    </OrgContext.Provider>
  );
}

export function useOrg() {
  return useContext(OrgContext);
}
