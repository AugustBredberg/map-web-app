"use client";

import { useEffect, useState, useCallback } from "react";
import { Button, Input, Spinner } from "@heroui/react";
import { useOrg } from "@/context/OrgContext";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth";
import type { Organization } from "@/lib/supabase";
import {
  getOrgInvitations,
  cancelInvitation,
  getMyInvitations,
  acceptInvitation,
} from "@/lib/invitations";
import type { Invitation, InvitationWithOrg } from "@/lib/invitations";
import InviteMemberForm from "@/components/settings/InviteMemberForm";

export default function SettingsPage() {
  const { organizations, activeOrg, activeRole, displayName, setActiveOrg, loading, refreshOrgs } = useOrg();
  const { session } = useAuth();
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

  const refreshOrgInvitations = useCallback(() => setOrgInvitesKey((k) => k + 1), []);

  useEffect(() => {
    if (!activeOrg || activeRole !== "admin") return;
    const doFetch = async () => {
      const { data } = await getOrgInvitations(activeOrg.organization_id);
      setOrgInvitations(data ?? []);
    };
    void doFetch();
  }, [activeOrg, activeRole, orgInvitesKey]);

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
    router.push("/map");
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  return (
    <div className="dark flex min-h-screen flex-col bg-gray-950 text-white">
      {/* Header */}
      <header className="flex h-14 items-center justify-between border-b border-gray-800 px-6">
        <span className="text-base font-semibold">Settings</span>
        {activeOrg && (
          <Button
            variant="light"
            size="sm"
            onPress={() => router.back()}
            className="text-gray-400"
          >
            ← Back
          </Button>
        )}
      </header>

      <main className="mx-auto w-full max-w-lg flex-1 px-6 py-10">
        {/* Account */}
        <section className="mb-10">
          <h2 className="mb-1 text-xs font-semibold uppercase tracking-widest text-gray-500">
            Account
          </h2>
          <div className="rounded-xl bg-gray-900 px-4 py-3 ring-1 ring-white/10">
            {displayName && (
              <p className="text-sm font-medium text-white">{displayName}</p>
            )}
            <p className="text-sm text-gray-300">{session?.user.email}</p>
            {activeRole && (
              <p className="mt-1 text-xs text-gray-500">
                Role: <span className="capitalize text-gray-400">{activeRole}</span>
              </p>
            )}
          </div>
        </section>

        {/* Organization selector */}
        <section className="mb-10">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-500">
            Organization
          </h2>

          {loading ? (
            <div className="flex justify-center py-2">
              <Spinner color="white" />
            </div>
          ) : organizations.length === 0 ? (
            <div className="rounded-xl bg-gray-900 px-4 py-4 ring-1 ring-white/10">
              <p className="text-sm text-gray-400">
                You are not a member of any organization. Contact your
                administrator to be added.
              </p>
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {organizations.map((org) => {
                const isActive = activeOrg?.organization_id === org.organization_id;
                return (
                  <li key={org.organization_id}>
                    <Button
                      onPress={() => handleSelect(org)}
                      variant={isActive ? "flat" : "bordered"}
                      color={isActive ? "primary" : "default"}
                      className="w-full justify-between"
                      endContent={
                        isActive ? (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-3 w-3"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        ) : null
                      }
                    >
                      <span className="text-sm font-medium">{org.name}</span>
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Admin: Invite Members */}
        {!loading && activeOrg && activeRole === "admin" && (
          <section className="mb-10">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-500">
              Invite Members
            </h2>
            <div className="flex flex-col gap-4 rounded-xl bg-gray-900 px-4 py-4 ring-1 ring-white/10">
              <InviteMemberForm
                organizationId={activeOrg.organization_id}
                invitedBy={session!.user.id}
                onInvited={refreshOrgInvitations}
              />
              {orgInvitations.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-medium text-gray-500">Pending invitations</p>
                  <ul className="flex flex-col gap-2">
                    {orgInvitations.map((inv) => (
                      <li key={inv.id} className="flex items-center justify-between">
                        <span className="text-sm text-gray-300">{inv.invitee_email}</span>
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
          <section className="mb-10">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-500">
              Pending Invitations
            </h2>
            <ul className="flex flex-col gap-2">
              {myInvitations.map((inv) => (
                <li
                  key={inv.id}
                  className="flex flex-col gap-3 rounded-xl bg-gray-900 px-4 py-3 ring-1 ring-white/10"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">
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

        {/* Sign out */}
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-500">
            Session
          </h2>
          <Button
            color="danger"
            variant="flat"
            onPress={handleSignOut}
            fullWidth
          >
            Sign out
          </Button>
        </section>
      </main>
    </div>
  );
}
