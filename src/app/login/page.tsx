"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Spinner } from "@heroui/react";
import { signInWithPassword, signUp } from "@/lib/auth";
import { useAuth } from "@/context/AuthContext";
import { useLocale } from "@/context/LocaleContext";

type AuthMode = "signin" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const { session, loading: authLoading } = useAuth();
  const { t } = useLocale();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && session) {
      router.replace("/map");
    }
  }, [session, authLoading, router]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <Spinner color="primary" />
      </div>
    );
  }

  if (session) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    if (mode === "signin") {
      const { error } = await signInWithPassword(email, password);
      if (error) {
        setError(error);
      } else {
        router.push("/map");
      }
    } else {
      const { error } = await signUp(email, password);
      if (error) {
        setError(error);
      } else {
        setMessage(t("login.confirmEmailMessage"));
      }
    }

    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-lg ring-1 ring-gray-200">
        {/* Header */}
        <h1 className="mb-1 text-2xl font-bold text-gray-900">
          {mode === "signin" ? t("login.signIn") : t("login.createAccount")}
        </h1>
        <p className="mb-6 text-sm text-gray-500">
          {mode === "signin" ? t("login.welcomeBack") : t("login.getStarted")}
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            id="email"
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
            id="password"
            type="password"
            label={t("login.password")}
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            isRequired
            minLength={6}
            value={password}
            onValueChange={setPassword}
            placeholder={t("login.passwordPlaceholder")}
            variant="bordered"
          />

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 ring-1 ring-red-200">
              {error}
            </p>
          )}
          {message && (
            <p className="rounded-lg bg-green-50 px-3 py-2 text-xs text-green-700 ring-1 ring-green-200">
              {message}
            </p>
          )}

          <Button
            type="submit"
            color="primary"
            isLoading={loading}
            fullWidth
            className="mt-1"
          >
            {mode === "signin" ? t("login.signIn") : t("login.createAccount")}
          </Button>
        </form>

        {/* Toggle mode */}
        <p className="mt-5 text-center text-sm text-gray-500">
          {mode === "signin" ? (
            <>
              {t("login.noAccount")}{" "}
              <Button
                variant="light"
                size="sm"
                color="primary"
                onPress={() => { setMode("signup"); setError(null); setMessage(null); }}
                className="h-auto min-w-0 p-0 font-medium"
              >
                {t("login.signUp")}
              </Button>
            </>
          ) : (
            <>
              {t("login.alreadyHaveAccount")}{" "}
              <Button
                variant="light"
                size="sm"
                color="primary"
                onPress={() => { setMode("signin"); setError(null); setMessage(null); }}
                className="h-auto min-w-0 p-0 font-medium"
              >
                {t("login.signIn")}
              </Button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
