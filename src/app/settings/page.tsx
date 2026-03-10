"use client";

import { useOrg } from "@/context/OrgContext";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Organization } from "@/lib/supabase";

export default function SettingsPage() {
  const { organizations, activeOrg, setActiveOrg, loading } = useOrg();
  const { session } = useAuth();
  const router = useRouter();

  const handleSelect = (org: Organization) => {
    setActiveOrg(org);
    router.push("/map");
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-950 text-white">
      {/* Header */}
      <header className="flex h-14 items-center justify-between border-b border-gray-800 px-6">
        <span className="text-base font-semibold">Settings</span>
        {activeOrg && (
          <button
            onClick={() => router.back()}
            className="text-sm text-gray-400 hover:text-white"
          >
            ← Back
          </button>
        )}
      </header>

      <main className="mx-auto w-full max-w-lg flex-1 px-6 py-10">
        {/* Account */}
        <section className="mb-10">
          <h2 className="mb-1 text-xs font-semibold uppercase tracking-widest text-gray-500">
            Account
          </h2>
          <div className="rounded-xl bg-gray-900 px-4 py-3 ring-1 ring-white/10">
            <p className="text-sm text-gray-300">{session?.user.email}</p>
          </div>
        </section>

        {/* Organization selector */}
        <section className="mb-10">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-500">
            Organization
          </h2>

          {loading ? (
            <p className="text-sm text-gray-400">Loading organizations…</p>
          ) : organizations.length === 0 ? (
            <div className="rounded-xl bg-gray-900 px-4 py-4 ring-1 ring-white/10">
              <p className="text-sm text-gray-400">
                You are not a member of any organization. Contact your
                administrator to be added.
              </p>
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {organizations.map((org) => {
                const isActive = activeOrg?.organization_id === org.organization_id;
                return (
                  <li key={org.organization_id}>
                    <button
                      onClick={() => handleSelect(org)}
                      className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-left ring-1 transition-colors ${
                        isActive
                          ? "bg-blue-600/20 ring-blue-500 text-white"
                          : "bg-gray-900 ring-white/10 text-gray-200 hover:bg-gray-800"
                      }`}
                    >
                      <span className="text-sm font-medium">{org.name}</span>
                      {isActive && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-3 w-3 text-white"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Sign out */}
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-500">
            Session
          </h2>
          <button
            onClick={handleSignOut}
            className="w-full rounded-xl bg-gray-900 px-4 py-3 text-left text-sm font-medium text-red-400 ring-1 ring-white/10 transition-colors hover:bg-gray-800 hover:text-red-300"
          >
            Sign out
          </button>
        </section>
      </main>
    </div>
  );
}
