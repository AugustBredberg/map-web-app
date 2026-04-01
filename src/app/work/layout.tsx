import AuthGuard from "@/components/AuthGuard";
import OrgGuard from "@/components/OrgGuard";
import NavMenu from "@/components/NavMenu";
import type { ReactNode } from "react";

export default function WorkLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <OrgGuard>
        <NavMenu>
          <main className="relative flex min-h-0 flex-1 flex-col overflow-hidden">{children}</main>
        </NavMenu>
      </OrgGuard>
    </AuthGuard>
  );
}
