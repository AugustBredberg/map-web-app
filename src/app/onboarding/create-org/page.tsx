"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Spinner } from "@heroui/react";
import { useAuth } from "@/context/AuthContext";
import { useOrg } from "@/context/OrgContext";
import { createOrganizationForSelfServe } from "@/lib/organizations";
import { useLocale } from "@/context/LocaleContext";

export default function CreateOrgPage() {
  const router = useRouter();
  const { session, systemRole, signupSource, loading: authLoading } = useAuth();
  const { organizations, loading: orgLoading, refreshOrgs } = useOrg();
  const { t } = useLocale();

  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loading = authLoading || orgLoading;
  const emailConfirmed = Boolean(session?.user.email_confirmed_at);

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
    if (signupSource !== "self_serve") {
      router.replace("/onboarding/no-organization");
    }
  }, [loading, systemRole, organizations.length, signupSource, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !emailConfirmed) return;
    setSubmitting(true);
    setError(null);
    const { error: rpcError } = await createOrganizationForSelfServe(name.trim());
    setSubmitting(false);
    if (rpcError) {
      setError(rpcError);
      return;
    }
    refreshOrgs();
    router.push("/map");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Spinner color="primary" />
      </div>
    );
  }

  if (systemRole === "dev" || organizations.length > 0 || signupSource !== "self_serve") {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-8 shadow-lg ring-1 ring-border">
        <h1 className="text-2xl font-bold text-foreground">{t("onboarding.createOrgTitle")}</h1>
        <p className="mt-2 text-sm text-muted">{t("onboarding.createOrgSub")}</p>

        {!emailConfirmed ? (
          <div className="mt-6 rounded-xl bg-muted-bg px-4 py-3 text-sm text-foreground">
            <p className="font-semibold">{t("onboarding.verifyEmailTitle")}</p>
            <p className="mt-1 text-muted">{t("onboarding.verifyEmailBody")}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            <Input
              label={t("onboarding.companyName")}
              value={name}
              onValueChange={setName}
              variant="bordered"
              autoComplete="organization"
              isRequired
            />
            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 ring-1 ring-red-200 dark:bg-red-950/40 dark:text-red-300 dark:ring-red-900">
                {error}
              </p>
            )}
            <Button
              type="submit"
              color="primary"
              size="lg"
              className="font-semibold"
              isLoading={submitting}
              isDisabled={!name.trim()}
            >
              {t("onboarding.continue")}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
