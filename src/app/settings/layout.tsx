import AuthGuard from "@/components/AuthGuard";
import NavMenu from "@/components/NavMenu";
import type { ReactNode } from "react";

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <NavMenu>
        <main className="flex-1 overflow-y-auto bg-gray-50">
          {children}
        </main>
      </NavMenu>
    </AuthGuard>
  );
}
