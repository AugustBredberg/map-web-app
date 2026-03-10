import AuthGuard from "@/components/AuthGuard";
import OrgGuard from "@/components/OrgGuard";
import type { ReactNode } from "react";

export default function MapLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <OrgGuard>{children}</OrgGuard>
    </AuthGuard>
  );
}
