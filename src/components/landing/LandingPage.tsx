"use client";

import { useState, useEffect, type FormEvent, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Input, Spinner } from "@heroui/react";
import { signInWithPassword, signUp } from "@/lib/auth";
import { useAuth } from "@/context/AuthContext";
import { useOrg } from "@/context/OrgContext";
import { useLocale } from "@/context/LocaleContext";

type AuthMode = "signin" | "signup";

function BenefitRow({ children }: { children: ReactNode }) {
  return (
    <li className="flex gap-3 text-[15px] leading-snug text-foreground/90">
      <span
        className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
        aria-hidden
      />
      <span>{children}</span>
    </li>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session, systemRole, signupSource, loading: authLoading } = useAuth();
  const { organizations, loading: orgLoading, activeRole } = useOrg();
  const { t } = useLocale();

  const mode: AuthMode =
    searchParams.get("mode") === "signin" ? "signin" : "signup";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || orgLoading) return;
    if (!session) return;
    if (systemRole === "dev") {
      router.replace("/map");
      return;
    }
    if (organizations.length > 0) {
      if (activeRole === "member") {
        router.replace("/work");
      } else {
        router.replace("/map");
      }
      return;
    }
    if (signupSource === "self_serve") {
      router.replace("/onboarding/create-org");
      return;
    }
    router.replace("/onboarding/no-organization");
  }, [session, authLoading, orgLoading, systemRole, signupSource, organizations.length, activeRole, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    if (mode === "signin") {
      const { error: err } = await signInWithPassword(email, password);
      if (err) {
        setError(err);
      }
      // Post-login route (map vs onboarding) is chosen in useEffect once session/org load.
    } else {
      const { data, error: err } = await signUp(email, password);
      if (err) {
        setError(err);
      } else {
        const existingUser =
          Boolean(data?.user) &&
          Array.isArray(data?.user?.identities) &&
          data.user.identities.length === 0;

        if (existingUser) {
          // Supabase may return no error for an already-registered, confirmed user.
          // In that case, attempt a password sign-in instead of showing "confirm email".
          const { error: signInErr } = await signInWithPassword(email, password);
          if (signInErr) {
            setError(signInErr);
          }
        } else {
          setMessage(t("login.confirmEmailMessage"));
        }
      }
    }

    setLoading(false);
  };

  const switchMode = (next: AuthMode) => {
    setError(null);
    setMessage(null);
    const q = next === "signin" ? "mode=signin" : "mode=signup";
    router.replace(`/?${q}`, { scroll: false });
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Spinner color="primary" />
      </div>
    );
  }

  if (session) {
    return null;
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(29,78,216,0.12),transparent)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,transparent,rgba(232,234,239,0.6))]"
        aria-hidden
      />

      <header className="relative z-10 flex items-center justify-between px-5 py-5 sm:px-8">
        <span className="text-lg font-semibold tracking-tight">
          {t("home.title")}
        </span>
        <Button
          variant={mode === "signin" ? "solid" : "flat"}
          color={mode === "signin" ? "primary" : "default"}
          size="sm"
          radius="full"
          className={`font-medium ${
            mode === "signin"
              ? ""
              : "bg-muted-bg text-foreground/90 hover:bg-muted"
          }`}
          onPress={() => switchMode("signin")}
        >
          {t("home.headerSignIn")}
        </Button>
      </header>

      <main className="relative z-10 mx-auto grid max-w-6xl gap-12 px-5 pb-16 pt-2 sm:px-8 lg:grid-cols-[1fr_min(26rem,100%)] lg:items-center lg:gap-16 lg:pt-8">
        <section className="max-w-xl">
          <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl">
            {t("home.landingHeadline")}
          </h1>
          <p className="mt-5 text-pretty text-lg leading-relaxed text-muted">
            {t("home.landingSub")}
          </p>
          <ul className="mt-8 space-y-3">
            <BenefitRow>{t("home.benefit1")}</BenefitRow>
            <BenefitRow>{t("home.benefit2")}</BenefitRow>
            <BenefitRow>{t("home.benefit3")}</BenefitRow>
          </ul>
          <p className="mt-10 text-sm leading-relaxed text-muted">
            {t("home.inviteHint")}
          </p>
        </section>

        <section className="w-full lg:justify-self-end">
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-[0_20px_50px_-12px_rgba(15,23,42,0.12)] sm:p-8">
            <div className="mb-6 flex rounded-xl bg-muted-bg p-1">
              <button
                type="button"
                onClick={() => switchMode("signup")}
                className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-colors ${
                  mode === "signup"
                    ? "bg-surface text-foreground shadow-sm"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {t("home.tabCreateAccount")}
              </button>
              <button
                type="button"
                onClick={() => switchMode("signin")}
                className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-colors ${
                  mode === "signin"
                    ? "bg-surface text-foreground shadow-sm"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {t("home.tabSignIn")}
              </button>
            </div>

            <h2 className="mb-1 text-xl font-bold text-foreground">
              {mode === "signin" ? t("login.signIn") : t("login.createAccount")}
            </h2>
            <p className="mb-6 text-sm text-muted">
              {mode === "signin"
                ? t("login.welcomeBack")
                : t("login.getStarted")}
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Input
                id="landing-email"
                type="email"
                label={t("login.email")}
                autoComplete="email"
                isRequired
                value={email}
                onValueChange={setEmail}
                placeholder={t("login.emailPlaceholder")}
                variant="bordered"
              />

              <Input
                id="landing-password"
                type="password"
                label={t("login.password")}
                autoComplete={
                  mode === "signin" ? "current-password" : "new-password"
                }
                isRequired
                minLength={6}
                value={password}
                onValueChange={setPassword}
                placeholder={t("login.passwordPlaceholder")}
                variant="bordered"
              />

              {error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 ring-1 ring-red-200 dark:bg-red-950/40 dark:text-red-300 dark:ring-red-900">
                  {error}
                </p>
              )}
              {message && (
                <p className="rounded-lg bg-green-50 px-3 py-2 text-xs text-green-700 ring-1 ring-green-200 dark:bg-green-950/40 dark:text-green-300 dark:ring-green-900">
                  {message}
                </p>
              )}

              <Button
                type="submit"
                color="primary"
                isLoading={loading}
                fullWidth
                size="lg"
                radius="lg"
                className="mt-1 font-semibold"
              >
                {mode === "signin" ? t("login.signIn") : t("home.ctaSubmit")}
              </Button>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}
