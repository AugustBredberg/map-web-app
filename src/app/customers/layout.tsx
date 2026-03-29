import AuthGuard from "@/components/AuthGuard";
import OrgGuard from "@/components/OrgGuard";
import NavMenu from "@/components/NavMenu";
import type { ReactNode } from "react";

export default function CustomersLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <OrgGuard>
        <NavMenu>
          <main className="flex-1 overflow-y-auto bg-background">{children}</main>
        </NavMenu>
      </OrgGuard>
    </AuthGuard>
  );
}
