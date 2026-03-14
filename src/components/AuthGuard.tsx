"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@heroui/react";
import { useAuth } from "@/context/AuthContext";

export default function AuthGuard({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !session) {
      router.replace("/login");
    }
  }, [session, loading, router]);

  // Safety net: if loading is still true after 8 seconds something went wrong
  // (e.g. network hung mid-init). Redirect to login so the user isn't stuck.
  useEffect(() => {
    if (!loading) return;
    const timeout = setTimeout(() => {
      router.replace("/login");
    }, 8000);
    return () => clearTimeout(timeout);
  }, [loading, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-950">
        <Spinner color="white" />
      </div>
    );
  }

  if (!session) {
    // Will redirect via useEffect; render nothing in the meantime
    return null;
  }

  return <>{children}</>;
}
