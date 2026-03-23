"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Input, Spinner, Tabs, Tab } from "@heroui/react";
import { supabase } from "@/lib/supabase";
import { signInWithPassword, signOut } from "@/lib/auth";
import {
  getInvitationByToken,
  acceptInvitationByToken,
  type InvitationDetail,
} from "@/lib/invitations";
import { useAuth } from "@/context/AuthContext";
import { useLocale } from "@/context/LocaleContext";

type FormMode = "new-user" | "sign-in";

export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const { session, loading: authLoading } = useAuth();
  const { t } = useLocale();

  // Raw state — page view is derived from these
  const [invitation, setInvitation] = useState<InvitationDetail | null>(null);
  const [inviteLoadFailed, setInviteLoadFailed] = useState(false);
  const [isAutoAccepting, setIsAutoAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>("new-user");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");

  // Prevent the auto-accept from running more than once
  const autoAcceptTriggeredRef = useRef(false);

  // Derive the current page view — no setState calls needed in effects for this
  const pageState = useMemo(() => {
    if (accepted) return "done" as const;
    if (isAutoAccepting) return "auto-accepting" as const;
    if (inviteLoadFailed) return "error" as const;
    if (!invitation || authLoading) return "loading" as const;
    if (session && session.user.email !== invitation.invitee_email) return "wrong-account" as const;
    return "form" as const;
  }, [accepted, isAutoAccepting, inviteLoadFailed, invitation, authLoading, session]);

  // 1. Load invitation by token
  useEffect(() => {
    getInvitationByToken(token).then(({ data, error: fetchError }) => {
      if (fetchError || !data) {
        setInviteLoadFailed(true);
        return;
      }
      setInvitation(data);
    });
  }, [token]);

  const acceptForCurrentUser = useCallback(
    async (userId: string, userEmail: string) => {
      setIsAutoAccepting(true);
      const name = displayName.trim() || userEmail;
      const { error: acceptError } = await acceptInvitationByToken(token, userId, name);
      if (acceptError) {
        setError(acceptError);
        setIsAutoAccepting(false);
      } else {
        setIsAutoAccepting(false);
        setAccepted(true);
      }
    },
    [token, displayName],
  );

  // 2. Auto-accept when user is already signed in with the correct email
  useEffect(() => {
    if (
      !authLoading &&
      invitation &&
      session &&
      session.user.email === invitation.invitee_email &&
      !autoAcceptTriggeredRef.current
    ) {
      autoAcceptTriggeredRef.current = true;
      setTimeout(() => {
        void acceptForCurrentUser(session.user.id, session.user.email!);
      }, 0);
    }
  }, [authLoading, invitation, session, acceptForCurrentUser]);

  const handleSignOut = async () => {
    await signOut();
    autoAcceptTriggeredRef.current = false;
  };

  // Handle "Create account" tab submission
  const handleCreateAccount = async () => {
    if (!invitation) return;
    setError(null);
    setIsSubmitting(true);

    const { data: fnData, error: fnError } = await supabase.functions.invoke("accept-invite", {
      body: {
        token,
        password,
        display_name: displayName.trim() || invitation.invitee_email,
      },
    });

    if (fnError || fnData?.error) {
      const msg: string = fnData?.error ?? fnError?.message ?? "Unknown error";
      if (fnData?.code === "account_exists" || msg.toLowerCase().includes("already exists")) {
        setError(t("invite.accountExistsError"));
        setFormMode("sign-in");
      } else {
        setError(msg);
      }
      setIsSubmitting(false);
      return;
    }

    const { error: signInError } = await signInWithPassword(invitation.invitee_email, password);
    if (signInError) {
      setError(signInError);
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
    setAccepted(true);
  };

  // Handle "Sign in" tab submission
  const handleSignIn = async () => {
    if (!invitation) return;
    setError(null);
    setIsSubmitting(true);

    const { error: signInError } = await signInWithPassword(invitation.invitee_email, password);
    if (signInError) {
      setError(signInError);
      setIsSubmitting(false);
      return;
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user.id;
    if (!userId) {
      setError("Failed to establish session after sign in.");
      setIsSubmitting(false);
      return;
    }

    const name = displayName.trim() || invitation.invitee_email;
    const { error: acceptError } = await acceptInvitationByToken(token, userId, name);
    if (acceptError) {
      setError(acceptError);
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
    setAccepted(true);
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-2xl bg-surface p-8 shadow-lg ring-1 ring-border">
        {/* App name */}
        <p className="mb-6 text-center text-sm font-medium text-muted">{t("nav.appName")}</p>

        {pageState === "loading" && (
          <div className="flex flex-col items-center gap-3">
            <Spinner color="primary" />
            <p className="text-sm text-muted">{t("invite.loading")}</p>
          </div>
        )}

        {pageState === "error" && (
          <div className="flex flex-col gap-2 text-center">
            <h1 className="text-xl font-bold text-foreground">{t("invite.invalidTitle")}</h1>
            <p className="text-sm text-muted">{t("invite.invalidMessage")}</p>
          </div>
        )}

        {pageState === "wrong-account" && invitation && (
          <div className="flex flex-col gap-4">
            <h1 className="text-xl font-bold text-foreground">{t("invite.wrongAccountTitle")}</h1>
            <p className="text-sm text-muted">
              {t("invite.wrongAccountMessage").replace("{0}", invitation.invitee_email)}
            </p>
            <Button color="primary" onPress={handleSignOut}>
              {t("invite.signOutAndContinue")}
            </Button>
          </div>
        )}

        {pageState === "form" && invitation && (
          <div className="flex flex-col gap-5">
            <div>
              <p className="text-sm text-muted">{t("invite.youreInvited")}</p>
              <h1 className="text-2xl font-bold text-foreground">{invitation.organization_name}</h1>
            </div>

            <Tabs
              selectedKey={formMode}
              onSelectionChange={(key) => {
                setFormMode(key as FormMode);
                setError(null);
                setPassword("");
              }}
              fullWidth
              size="sm"
            >
              <Tab key="new-user" title={t("invite.createAccountTab")}>
                <div className="mt-3 flex flex-col gap-3">
                  <Input
                    type="email"
                    label={t("login.email")}
                    value={invitation.invitee_email}
                    isReadOnly
                    variant="bordered"
                    size="sm"
                  />
                  <Input
                    type="text"
                    label={t("invite.displayName")}
                    placeholder={t("invite.displayNamePlaceholder")}
                    value={displayName}
                    onValueChange={setDisplayName}
                    variant="bordered"
                    size="sm"
                    autoComplete="name"
                  />
                  <Input
                    type="password"
                    label={t("invite.password")}
                    placeholder={t("invite.passwordPlaceholder")}
                    value={password}
                    onValueChange={setPassword}
                    variant="bordered"
                    size="sm"
                    autoComplete="new-password"
                    minLength={6}
                    onKeyDown={(e) => e.key === "Enter" && void handleCreateAccount()}
                  />
                  <Button
                    color="primary"
                    isLoading={isSubmitting}
                    isDisabled={!password || password.length < 6}
                    onPress={() => void handleCreateAccount()}
                  >
                    {t("invite.joinButton")}
                  </Button>
                </div>
              </Tab>

              <Tab key="sign-in" title={t("invite.signInTab")}>
                <div className="mt-3 flex flex-col gap-3">
                  <Input
                    type="email"
                    label={t("login.email")}
                    value={invitation.invitee_email}
                    isReadOnly
                    variant="bordered"
                    size="sm"
                  />
                  <Input
                    type="text"
                    label={t("invite.displayName")}
                    placeholder={t("invite.displayNamePlaceholder")}
                    value={displayName}
                    onValueChange={setDisplayName}
                    variant="bordered"
                    size="sm"
                    autoComplete="name"
                  />
                  <Input
                    type="password"
                    label={t("invite.password")}
                    placeholder={t("invite.currentPasswordPlaceholder")}
                    value={password}
                    onValueChange={setPassword}
                    variant="bordered"
                    size="sm"
                    autoComplete="current-password"
                    onKeyDown={(e) => e.key === "Enter" && void handleSignIn()}
                  />
                  <Button
                    color="primary"
                    isLoading={isSubmitting}
                    isDisabled={!password}
                    onPress={() => void handleSignIn()}
                  >
                    {t("invite.signInAndJoinButton")}
                  </Button>
                </div>
              </Tab>
            </Tabs>

            {error && <p className="text-xs text-danger">{error}</p>}
          </div>
        )}

        {pageState === "auto-accepting" && (
          <div className="flex flex-col items-center gap-3">
            <Spinner color="primary" />
            <p className="text-sm text-muted">{t("invite.accepting")}</p>
          </div>
        )}

        {pageState === "done" && (
          <div className="flex flex-col items-center gap-4 text-center">
            <h1 className="text-xl font-bold text-foreground">{t("invite.successTitle")}</h1>
            <p className="text-sm text-muted">{t("invite.successMessage")}</p>
            <Button color="primary" onPress={() => router.push("/map")}>
              {t("invite.goToApp")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
