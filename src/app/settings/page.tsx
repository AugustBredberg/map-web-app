"use client";

import { Button, Spinner } from "@heroui/react";
import { useOrg } from "@/context/OrgContext";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Organization } from "@/lib/supabase";

export default function SettingsPage() {
  const { organizations, activeOrg, activeRole, displayName, setActiveOrg, loading } = useOrg();
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
    <div className="dark flex min-h-screen flex-col bg-gray-950 text-white">
      {/* Header */}
      <header className="flex h-14 items-center justify-between border-b border-gray-800 px-6">
        <span className="text-base font-semibold">Settings</span>
        {activeOrg && (
          <Button
            variant="light"
            size="sm"
            onPress={() => router.back()}
            className="text-gray-400"
          >
            ← Back
          </Button>
        )}
      </header>

      <main className="mx-auto w-full max-w-lg flex-1 px-6 py-10">
        {/* Account */}
        <section className="mb-10">
          <h2 className="mb-1 text-xs font-semibold uppercase tracking-widest text-gray-500">
            Account
          </h2>
          <div className="rounded-xl bg-gray-900 px-4 py-3 ring-1 ring-white/10">
            {displayName && (
              <p className="text-sm font-medium text-white">{displayName}</p>
            )}
            <p className="text-sm text-gray-300">{session?.user.email}</p>
            {activeRole && (
              <p className="mt-1 text-xs text-gray-500">
                Role: <span className="capitalize text-gray-400">{activeRole}</span>
              </p>
            )}
          </div>
        </section>

        {/* Organization selector */}
        <section className="mb-10">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-500">
            Organization
          </h2>

          {loading ? (
            <div className="flex justify-center py-2">
              <Spinner color="white" />
            </div>
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
                    <Button
                      onPress={() => handleSelect(org)}
                      variant={isActive ? "flat" : "bordered"}
                      color={isActive ? "primary" : "default"}
                      className="w-full justify-between"
                      endContent={
                        isActive ? (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-3 w-3"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        ) : null
                      }
                    >
                      <span className="text-sm font-medium">{org.name}</span>
                    </Button>
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
          <Button
            color="danger"
            variant="flat"
            onPress={handleSignOut}
            fullWidth
          >
            Sign out
          </Button>
        </section>
      </main>
    </div>
  );
}
