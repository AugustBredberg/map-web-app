import AuthGuard from "@/components/AuthGuard";
import NavMenu from "@/components/NavMenu";
import type { ReactNode } from "react";

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex h-screen w-screen flex-col overflow-hidden md:flex-row">
        <NavMenu />
        <main className="flex-1 overflow-y-auto bg-gray-50">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
