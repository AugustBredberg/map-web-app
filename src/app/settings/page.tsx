"use client";

import { useEffect, useState, useCallback } from "react";
import { Button, Input, Select, SelectItem, Spinner } from "@heroui/react";
import { useOrg } from "@/context/OrgContext";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth";
import type { Organization } from "@/lib/supabase";
import { hasMinRole } from "@/lib/supabase";
import type { Role, OrganizationMember } from "@/lib/supabase";
import { getOrgMembers, updateMemberRole } from "@/lib/members";
import {
  getOrgInvitations,
  cancelInvitation,
  getMyInvitations,
  acceptInvitation,
} from "@/lib/invitations";
import type { Invitation, InvitationWithOrg } from "@/lib/invitations";
import InviteMemberForm from "@/components/settings/InviteMemberForm";
import { createOrganization } from "@/lib/organizations";

export default function SettingsPage() {
  const { organizations, activeOrg, activeRole, displayName, setActiveOrg, loading, refreshOrgs } = useOrg();
  const { session, systemRole } = useAuth();
  const router = useRouter();

  const [orgInvitations, setOrgInvitations] = useState<Invitation[]>([]);
  const [myInvitations, setMyInvitations] = useState<InvitationWithOrg[]>([]);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [acceptingId, setAcceptingId] = useState<number | null>(null);
  const [expandedInviteId, setExpandedInviteId] = useState<number | null>(null);
  const [draftName, setDraftName] = useState("");
  const [acceptError, setAcceptError] = useState<string | null>(null);
  const [orgInvitesKey, setOrgInvitesKey] = useState(0);
  const [myInvitesKey, setMyInvitesKey] = useState(0);
  const [newOrgName, setNewOrgName] = useState("");
  const [isCreatingOrg, setIsCreatingOrg] = useState(false);
  const [createOrgError, setCreateOrgError] = useState<string | null>(null);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [updatingRoleId, setUpdatingRoleId] = useState<string | null>(null);
  const [membersKey, setMembersKey] = useState(0);

  const refreshOrgInvitations = useCallback(() => setOrgInvitesKey((k) => k + 1), []);

  useEffect(() => {
    if (!activeOrg || !hasMinRole(activeRole, "admin")) return;
    const doFetch = async () => {
      const { data } = await getOrgInvitations(activeOrg.organization_id);
      setOrgInvitations(data ?? []);
    };
    void doFetch();
  }, [activeOrg, activeRole, orgInvitesKey]);

  useEffect(() => {
    if (!activeOrg || !hasMinRole(activeRole, "admin")) return;
    const doFetch = async () => {
      const { data } = await getOrgMembers(activeOrg.organization_id);
      setMembers(data ?? []);
    };
    void doFetch();
  }, [activeOrg, activeRole, membersKey]);

  const handleRoleChange = async (userId: string, role: Role) => {
    if (!activeOrg) return;
    setUpdatingRoleId(userId);
    await updateMemberRole(activeOrg.organization_id, userId, role);
    setUpdatingRoleId(null);
    setMembersKey((k) => k + 1);
  };

  useEffect(() => {
    const email = session?.user.email;
    if (!email) return;
    const doFetch = async () => {
      const { data } = await getMyInvitations(email);
      setMyInvitations(data ?? []);
    };
    void doFetch();
  }, [session, myInvitesKey]);

  const handleCancelInvitation = async (id: number) => {
    setCancellingId(id);
    await cancelInvitation(id);
    setCancellingId(null);
    setOrgInvitesKey((k) => k + 1);
  };

  const handleAcceptInvitation = async (inv: InvitationWithOrg) => {
    if (!session) return;
    setAcceptingId(inv.id);
    setAcceptError(null);
    const { error } = await acceptInvitation(inv.id, inv.organization_id, session.user.id, draftName.trim());
    setAcceptingId(null);
    if (error) {
      setAcceptError(error);
      return;
    }
    setExpandedInviteId(null);
    setDraftName("");
    setMyInvitesKey((k) => k + 1);
    refreshOrgs();
  };

  const handleSelect = (org: Organization) => {
    setActiveOrg(org);
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  const handleCreateOrg = async () => {
    if (!session || !newOrgName.trim()) return;
    setIsCreatingOrg(true);
    setCreateOrgError(null);
    const { error } = await createOrganization(newOrgName.trim());
    setIsCreatingOrg(false);
    if (error) {
      setCreateOrgError(error);
      return;
    }
    setNewOrgName("");
    refreshOrgs();
  };

  return (
    <div className="min-h-full bg-gray-50">
      <div className="mx-auto w-full max-w-2xl px-6 py-10">
        <h1 className="mb-8 text-2xl font-bold text-gray-900">Settings</h1>

        <div className="flex flex-col gap-8">

          {/* Account */}
          <section>
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-400">Account</p>
            <div className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-gray-900">{displayName ?? session?.user.email}</p>
                {displayName && (
                  <p className="truncate text-sm text-gray-500">{session?.user.email}</p>
                )}
              </div>
              {activeRole && (
                <span className="shrink-0 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold capitalize text-primary">
                  {activeRole}
                </span>
              )}
            </div>
          </section>

          {/* Organization selector */}
          <section>
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-400">Organization</p>
            {loading ? (
              <div className="flex justify-center py-4">
                <Spinner />
              </div>
            ) : organizations.length === 0 ? (
              <div className="rounded-2xl border border-gray-200 p-4 bg-white  shadow-sm">
                <p className="text-sm text-gray-500 p-y-2">
                  You are not a member of any organization. Contact your administrator to be added.
                </p>
              </div>
            ) : (
              <ul className="flex flex-col gap-2">
                {organizations.map((org) => {
                  const isActive = activeOrg?.organization_id === org.organization_id;
                  return (
                    <li key={org.organization_id}>
                      <button
                        onClick={() => handleSelect(org)}
                        className={`flex w-full items-center justify-between rounded-2xl border px-5 py-4 text-left shadow-sm transition-colors ${
                          isActive
                            ? "border-primary/40 bg-primary/5 text-gray-900"
                            : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold ${isActive ? "bg-primary/15 text-primary" : "bg-gray-100 text-gray-500"}`}>
                            {org.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-medium">{org.name}</span>
                        </div>
                        {isActive && (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* Admin: Members */}
          {!loading && activeOrg && hasMinRole(activeRole, "admin") && members.length > 0 && (
            <section>
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">Members</p>
              <div className="max-h-64 overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
                <ul className="divide-y divide-gray-100">
                  {members.map((member) => (
                    <li key={member.user_id} className="flex items-center justify-between px-5 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900">
                          {member.display_name ?? "Unnamed member"}
                        </p>
                      </div>
                      <Select
                        aria-label="Role"
                        size="sm"
                        variant="bordered"
                        selectedKeys={new Set([member.role ?? "member"])}
                        onSelectionChange={(keys) => {
                          const role = Array.from(keys)[0] as Role;
                          if (role && role !== member.role) handleRoleChange(member.user_id, role);
                        }}
                        isDisabled={updatingRoleId === member.user_id}
                        className="w-32 shrink-0"
                        classNames={{ trigger: "border-gray-200" }}
                      >
                        <SelectItem key="member">Member</SelectItem>
                        <SelectItem key="admin">Admin</SelectItem>
                      </Select>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}

          {/* Admin: Invite Members */}
          {!loading && activeOrg && hasMinRole(activeRole, "admin") && (
            <section>
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">Invite Members</p>
              <div className="flex flex-col gap-4">
                <InviteMemberForm
                  organizationId={activeOrg.organization_id}
                  invitedBy={session!.user.id}
                  onInvited={refreshOrgInvitations}
                />
                {orgInvitations.length > 0 && (
                  <div>
                    <p className="mb-3 text-xs font-semibold text-gray-400">Pending invitations</p>
                    <ul className="flex flex-col gap-2">
                      {orgInvitations.map((inv) => (
                        <li key={inv.id} className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                            <span className="text-sm text-gray-600">{inv.invitee_email}</span>
                          </div>
                          <Button
                            size="sm"
                            variant="light"
                            color="danger"
                            isLoading={cancellingId === inv.id}
                            isDisabled={!!cancellingId}
                            onPress={() => handleCancelInvitation(inv.id)}
                          >
                            Cancel
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Pending invitations for the current user */}
          {myInvitations.length > 0 && (
            <section>
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-400">Pending Invitations</p>
              <ul className="flex flex-col gap-3">
                {myInvitations.map((inv) => (
                  <li
                    key={inv.id}
                    className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {inv.organizations?.name ?? "Unknown organization"}
                        </p>
                        <p className="text-xs text-gray-500">Invited to join as member</p>
                      </div>
                      {expandedInviteId !== inv.id && (
                        <Button
                          size="sm"
                          color="primary"
                          isDisabled={!!acceptingId}
                          onPress={() => {
                            setExpandedInviteId(inv.id);
                            setDraftName("");
                            setAcceptError(null);
                          }}
                        >
                          Accept
                        </Button>
                      )}
                    </div>
                    {expandedInviteId === inv.id && (
                      <div className="flex flex-col gap-2">
                        <Input
                          autoFocus
                          placeholder="First and last name"
                          variant="bordered"
                          size="sm"
                          value={draftName}
                          onValueChange={setDraftName}
                          onKeyDown={(e) => e.key === "Enter" && draftName.trim() && handleAcceptInvitation(inv)}
                        />
                        {acceptError && <p className="text-xs text-danger">{acceptError}</p>}
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            color="primary"
                            isLoading={acceptingId === inv.id}
                            isDisabled={!draftName.trim()}
                            onPress={() => handleAcceptInvitation(inv)}
                            className="flex-1"
                          >
                            Confirm
                          </Button>
                          <Button
                            size="sm"
                            variant="flat"
                            isDisabled={!!acceptingId}
                            onPress={() => { setExpandedInviteId(null); setAcceptError(null); }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Dev: Create Organization */}
          {systemRole === "dev" && (
            <section>
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">Create Organization</p>
              <div className="flex flex-col gap-3">
                <Input
                  placeholder="Organization name"
                  variant="bordered"
                  value={newOrgName}
                  onValueChange={(v) => { setNewOrgName(v); setCreateOrgError(null); }}
                  onKeyDown={(e) => e.key === "Enter" && newOrgName.trim() && handleCreateOrg()}
                  isDisabled={isCreatingOrg}
                />
                {createOrgError && (
                  <p className="text-xs text-danger">{createOrgError}</p>
                )}
                <Button
                  color="primary"
                  isLoading={isCreatingOrg}
                  isDisabled={!newOrgName.trim()}
                  onPress={handleCreateOrg}
                  fullWidth
                >
                  Create
                </Button>
              </div>
            </section>
          )}

          {/* Sign out */}
          <section>
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-400">Session</p>
            <Button
              color="danger"
              variant="flat"
              onPress={handleSignOut}
              fullWidth
              className="rounded-2xl py-6 text-sm font-semibold"
            >
              Sign out
            </Button>
          </section>

        </div>
      </div>
    </div>
  );
}
