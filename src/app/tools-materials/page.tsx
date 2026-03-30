"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@heroui/react";
import { useOrg } from "@/context/OrgContext";
import { useAuth } from "@/context/AuthContext";
import { useLocale } from "@/context/LocaleContext";
import { hasMinRole } from "@/lib/supabase";
import ToolsMaterialsPageContent from "@/components/tools-materials/ToolsMaterialsPageContent";

export default function ToolsMaterialsPage() {
  const { activeOrg, activeRole, loading } = useOrg();
  const { systemRole } = useAuth();
  const { t } = useLocale();
  const router = useRouter();

  const canView = (!!activeOrg && hasMinRole(activeRole, "admin")) || systemRole === "dev";

  useEffect(() => {
    if (!loading && !canView) {
      router.replace("/projects");
    }
  }, [loading, canView, router]);

  if (loading) {
    return (
      <div className="flex h-full min-h-[50vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!canView || !activeOrg) {
    return null;
  }

  return (
    <div className="min-h-full bg-background">
      <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
        <ToolsMaterialsPageContent organizationId={activeOrg.organization_id} t={t} />
      </div>
    </div>
  );
}
