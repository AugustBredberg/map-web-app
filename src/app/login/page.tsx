"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, Input } from "@heroui/react";
import { signInWithPassword, signUp } from "@/lib/auth";

type AuthMode = "signin" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

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
        setMessage(
          "Check your email for a confirmation link, then sign in."
        );
      }
    }

    setLoading(false);
  };

  return (
    <div className="dark flex min-h-screen items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-gray-900 p-8 shadow-2xl ring-1 ring-white/10">
        {/* Header */}
        <h1 className="mb-1 text-2xl font-bold text-white">
          {mode === "signin" ? "Sign in" : "Create account"}
        </h1>
        <p className="mb-6 text-sm text-gray-400">
          {mode === "signin"
            ? "Welcome back to Map Web App."
            : "Get started with Map Web App."}
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            id="email"
            type="email"
            label="Email"
            autoComplete="email"
            isRequired
            value={email}
            onValueChange={setEmail}
            placeholder="you@example.com"
            variant="bordered"
          />

          <Input
            id="password"
            type="password"
            label="Password"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            isRequired
            minLength={6}
            value={password}
            onValueChange={setPassword}
            placeholder="••••••••"
            variant="bordered"
          />

          {error && (
            <p className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400 ring-1 ring-red-500/20">
              {error}
            </p>
          )}
          {message && (
            <p className="rounded-lg bg-green-500/10 px-3 py-2 text-xs text-green-400 ring-1 ring-green-500/20">
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
            {mode === "signin" ? "Sign in" : "Create account"}
          </Button>
        </form>

        {/* Toggle mode */}
        <p className="mt-5 text-center text-sm text-gray-400">
          {mode === "signin" ? (
            <>
              Don&apos;t have an account?{" "}
              <Button
                variant="light"
                size="sm"
                color="primary"
                onPress={() => { setMode("signup"); setError(null); setMessage(null); }}
                className="h-auto min-w-0 p-0 font-medium"
              >
                Sign up
              </Button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <Button
                variant="light"
                size="sm"
                color="primary"
                onPress={() => { setMode("signin"); setError(null); setMessage(null); }}
                className="h-auto min-w-0 p-0 font-medium"
              >
                Sign in
              </Button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
