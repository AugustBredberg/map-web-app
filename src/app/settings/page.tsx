"use client";

import { useEffect, useState, useCallback } from "react";
import { Button, Input, Select, SelectItem, Spinner, Switch } from "@heroui/react";
import { useTheme } from "next-themes";
import { useOrg } from "@/context/OrgContext";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth";
import type { Organization } from "@/lib/supabase";
import { hasMinRole } from "@/lib/supabase";
import type { Role, OrganizationMember } from "@/lib/supabase";
import { getOrgMembers, updateMemberRole, updateMemberHourlyRate } from "@/lib/members";
import {
  getOrgInvitations,
  cancelInvitation,
  getMyInvitations,
  acceptInvitation,
} from "@/lib/invitations";
import type { Invitation, InvitationWithOrg } from "@/lib/invitations";
import InviteMemberForm from "@/components/settings/InviteMemberForm";
import { createOrganization } from "@/lib/organizations";
import { useLocale } from "@/context/LocaleContext";

export default function SettingsPage() {
  const { organizations, activeOrg, activeRole, displayName, setActiveOrg, loading, refreshOrgs } = useOrg();
  const { session, systemRole, signupSource } = useAuth();
  const router = useRouter();
  const { locale, setLocale, t } = useLocale();

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
  const [roleChangeError, setRoleChangeError] = useState<string | null>(null);
  const [updatingRateId, setUpdatingRateId] = useState<string | null>(null);
  const [draftRates, setDraftRates] = useState<Record<string, string>>({});
  const [membersKey, setMembersKey] = useState(0);
  const { resolvedTheme, setTheme } = useTheme();

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
      const fetched = data ?? [];
      setMembers(fetched);
      setDraftRates(
        Object.fromEntries(
          fetched.map((m) => [m.user_id, m.hourly_rate != null ? String(m.hourly_rate) : ""])
        )
      );
    };
    void doFetch();
  }, [activeOrg, activeRole, membersKey]);

  const handleRoleChange = async (userId: string, role: Role) => {
    if (!activeOrg) return;
    setRoleChangeError(null);
    const target = members.find((member) => member.user_id === userId);
    const adminCount = members.filter((member) => member.role === "admin").length;
    const isDemotingLastAdmin = target?.role === "admin" && role !== "admin" && adminCount <= 1;
    if (isDemotingLastAdmin) {
      setRoleChangeError(t("settings.lastAdminRoleChangeError"));
      return;
    }
    setUpdatingRoleId(userId);
    const { error } = await updateMemberRole(activeOrg.organization_id, userId, role);
    setUpdatingRoleId(null);
    if (error) {
      setRoleChangeError(error);
      return;
    }
    setMembersKey((k) => k + 1);
  };

  const handleRateBlur = async (userId: string) => {
    if (!activeOrg) return;
    const raw = (draftRates[userId] ?? "").trim();
    const newRate = raw === "" ? null : parseFloat(raw);
    if (newRate !== null && isNaN(newRate)) return;
    const member = members.find((m) => m.user_id === userId);
    if (!member || newRate === member.hourly_rate) return;
    setUpdatingRateId(userId);
    await updateMemberHourlyRate(activeOrg.organization_id, userId, newRate);
    setUpdatingRateId(null);
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
    router.push("/?mode=signin");
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
    <div className="min-h-full bg-background">
      <div className="mx-auto w-full max-w-2xl px-6 py-10">
        <h1 className="mb-8 text-2xl font-bold text-foreground">{t("settings.title")}</h1>

        <div className="flex flex-col gap-8">

          {/* Appearance */}
          {/* Appearance */}
          <section>
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted">{t("settings.appearance")}</p>
            <div className="flex flex-col gap-3">
              {/* Dark mode */}
              <div className="flex items-center justify-between rounded-2xl bg-surface px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted-bg text-foreground">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t("settings.darkMode")}</p>
                    <p className="text-xs text-muted">{t("settings.darkModeDesc")}</p>
                  </div>
                </div>
                <Switch
                  isSelected={resolvedTheme === "dark"}
                  onValueChange={(val) => setTheme(val ? "dark" : "light")}
                  aria-label={t("settings.darkMode")}
                />
              </div>

              {/* Language */}
              <div className="flex items-center justify-between rounded-2xl bg-surface px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted-bg text-foreground">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t("settings.language")}</p>
                    <p className="text-xs text-muted">{t("settings.languageDesc")}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={locale === "en" ? "solid" : "flat"}
                    color={locale === "en" ? "primary" : "default"}
                    onPress={() => setLocale("en")}
                  >
                    English
                  </Button>
                  <Button
                    size="sm"
                    variant={locale === "sv" ? "solid" : "flat"}
                    color={locale === "sv" ? "primary" : "default"}
                    onPress={() => setLocale("sv")}
                  >
                    Svenska
                  </Button>
                </div>
              </div>
            </div>
          </section>

          {/* Account */}
          <section>
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted">{t("settings.account")}</p>
            <div className="flex items-center gap-4 rounded-2xl bg-surface px-5 py-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{displayName ?? session?.user.email}</p>
                {displayName && (
                  <p className="truncate text-sm text-muted">{session?.user.email}</p>
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
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted">{t("settings.organization")}</p>
            {loading ? (
              <div className="flex justify-center py-4">
                <Spinner />
              </div>
            ) : organizations.length === 0 ? (
              <div className="rounded-2xl bg-surface p-4">
                {signupSource === "self_serve" ? (
                  <div className="flex flex-col gap-3">
                    <p className="text-sm text-muted">{t("settings.selfServeNoOrg")}</p>
                    <Button color="primary" size="sm" className="w-fit" onPress={() => router.push("/onboarding/create-org")}>
                      {t("settings.goCreateCompany")}
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-muted">{t("settings.noOrganization")}</p>
                )}
              </div>
            ) : (
              <ul className="flex flex-col gap-2">
                {organizations.map((org) => {
                  const isActive = activeOrg?.organization_id === org.organization_id;
                  return (
                    <li key={org.organization_id}>
                      <button
                        onClick={() => handleSelect(org)}
                        className={`flex w-full cursor-pointer items-center justify-between rounded-2xl px-5 py-4 text-left shadow-sm transition-colors ${
                          isActive
                            ? " border border-primary/40 bg-primary/5 text-foreground"
                            : "bg-surface text-foreground hover:bg-muted-bg"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold ${isActive ? "bg-primary/15 text-primary" : "bg-muted-bg text-muted"}`}>
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
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted">{t("settings.members")}</p>
              {roleChangeError && <p className="mb-2 text-xs text-danger">{roleChangeError}</p>}
              <div className="max-h-64 overflow-y-auto rounded-2xl bg-surface">
                <ul>
                  {members.map((member) => (
                    <li key={member.user_id} className="flex items-center justify-between px-5 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {member.display_name ?? t("settings.unnamedMember")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div style={{ width: "7rem", flexShrink: 0 }}>
                          <Input
                            type="number"
                            size="sm"
                            variant="bordered"
                            placeholder={t("settings.hourlyRate")}
                            value={draftRates[member.user_id] ?? ""}
                            onValueChange={(val) =>
                              setDraftRates((prev) => ({ ...prev, [member.user_id]: val }))
                            }
                            onBlur={() => handleRateBlur(member.user_id)}
                            isDisabled={updatingRateId === member.user_id}
                          />
                        </div>
                        <div style={{ width: "9rem", flexShrink: 0 }}>
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
                          // classNames={{ trigger: "border-gray-200" }}
                        >
                          <SelectItem key="member">{t("settings.memberRole")}</SelectItem>
                          <SelectItem key="admin">{t("settings.adminRole")}</SelectItem>
                        </Select>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}

          {/* Admin: Invite Members */}
          {!loading && activeOrg && hasMinRole(activeRole, "admin") && (
            <section>
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted">{t("settings.inviteMembers")}</p>
              <div className="flex flex-col gap-4">
                <InviteMemberForm
                  organizationId={activeOrg.organization_id}
                  invitedBy={session!.user.id}
                  onInvited={refreshOrgInvitations}
                />
                {orgInvitations.length > 0 && (
                  <div>
                    <p className="mb-3 text-xs font-semibold text-muted">{t("settings.pendingInvitations")}</p>
                    <ul className="flex flex-col gap-2">
                      {orgInvitations.map((inv) => (
                        <li key={inv.id} className="flex items-center justify-between rounded-2xl border border-border bg-surface px-4 py-3 shadow-sm">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                            <span className="text-sm text-muted">{inv.invitee_email}</span>
                          </div>
                          <Button
                            size="sm"
                            variant="light"
                            color="danger"
                            isLoading={cancellingId === inv.id}
                            isDisabled={!!cancellingId}
                            onPress={() => handleCancelInvitation(inv.id)}
                          >
                            {t("settings.cancel")}
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
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted">{t("settings.pendingInvitationsSection")}</p>
              <ul className="flex flex-col gap-3">
                {myInvitations.map((inv) => (
                  <li
                    key={inv.id}
                    className="flex flex-col gap-3 rounded-2xl border border-border bg-surface px-5 py-4 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {inv.organizations?.name ?? t("settings.unknownOrganization")}
                        </p>
                        <p className="text-xs text-muted">{t("settings.invitedToJoin")}</p>
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
                          {t("settings.accept")}
                        </Button>
                      )}
                    </div>
                    {expandedInviteId === inv.id && (
                      <div className="flex flex-col gap-2">
                        <Input
                          autoFocus
                          autoComplete="off"
                          data-bwignore="true"
                          placeholder={t("settings.firstAndLastName")}
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
                            {t("settings.confirm")}
                          </Button>
                          <Button
                            size="sm"
                            variant="flat"
                            isDisabled={!!acceptingId}
                            onPress={() => { setExpandedInviteId(null); setAcceptError(null); }}
                          >
                            {t("settings.cancel")}
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
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted">{t("settings.createOrganization")}</p>
              <div className="flex flex-col gap-3">
                <Input
                  placeholder={t("settings.organizationNamePlaceholder")}
                  variant="bordered"
                  autoComplete="off"
                  data-bwignore="true"
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
                  {t("settings.create")}
                </Button>
              </div>
            </section>
          )}

          {/* Sign out */}
          <section>
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted">{t("settings.session")}</p>
            <Button
              color="danger"
              variant="flat"
              onPress={handleSignOut}
              fullWidth
              className="rounded-2xl py-6 text-sm font-semibold"
            >
              {t("settings.signOut")}
            </Button>
          </section>

        </div>
      </div>
    </div>
  );
}
