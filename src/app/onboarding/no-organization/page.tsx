"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, Spinner } from "@heroui/react";
import { useAuth } from "@/context/AuthContext";
import { useOrg } from "@/context/OrgContext";
import { useLocale } from "@/context/LocaleContext";

/**
 * Invite-only / unknown users who are not in any org (wrong email, revoked invite, etc.).
 */
export default function NoOrganizationPage() {
  const router = useRouter();
  const { systemRole, signupSource, loading: authLoading } = useAuth();
  const { organizations, loading: orgLoading } = useOrg();
  const { t } = useLocale();

  const loading = authLoading || orgLoading;

  useEffect(() => {
    if (loading) return;
    if (systemRole === "dev") {
      router.replace("/map");
      return;
    }
    if (organizations.length > 0) {
      router.replace("/map");
      return;
    }
    if (signupSource === "self_serve") {
      router.replace("/onboarding/create-org");
    }
  }, [loading, systemRole, organizations.length, signupSource, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Spinner color="primary" />
      </div>
    );
  }

  if (systemRole === "dev" || organizations.length > 0 || signupSource === "self_serve") {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-8 shadow-lg ring-1 ring-border">
        <h1 className="text-xl font-bold text-foreground">{t("onboarding.noOrgTitle")}</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">{t("onboarding.noOrgBody")}</p>
        <Button className="mt-6" variant="flat" onPress={() => router.push("/settings")}>
          {t("onboarding.backToSettings")}
        </Button>
      </div>
    </div>
  );
}
