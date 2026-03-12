"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@heroui/react";
import { useOrg } from "@/context/OrgContext";
import { useAuth } from "@/context/AuthContext";

export default function OrgGuard({ children }: { children: ReactNode }) {
  const { session, loading: authLoading } = useAuth();
  const { activeOrg, loading: orgLoading } = useOrg();
  const router = useRouter();

  const loading = authLoading || orgLoading;

  useEffect(() => {
    if (loading) return;
    if (!session) return; // AuthGuard handles this redirect
    if (!activeOrg) {
      router.replace("/settings");
    }
  }, [loading, session, activeOrg, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-950">
        <Spinner color="white" />
      </div>
    );
  }

  if (!activeOrg) {
    return null;
  }

  return <>{children}</>;
}
