"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { getSession, onAuthStateChange } from "@/lib/auth";
import { getSystemRole } from "@/lib/profiles";
import type { SystemRole } from "@/lib/supabase";

interface AuthContextValue {
  session: Session | null;
  /** System-level role (cross-org). null means regular user. */
  systemRole: SystemRole | null;
  /** True while the initial session is being fetched */
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  session: null,
  systemRole: null,
  loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [systemRole, setSystemRole] = useState<SystemRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    // Get the current session on mount. Always call setLoading(false) via finally
    // so a thrown error or hanging network call can never leave the app stuck.
    const boot = async () => {
      try {
        const { session: initialSession } = await getSession();
        if (cancelled) return;
        setSession(initialSession);
        if (initialSession) {
          const { data } = await getSystemRole(initialSession.user.id);
          if (!cancelled) setSystemRole(data);
        }
      } catch (err) {
        console.error("[AuthContext] Failed to load initial session:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void boot();

    // Keep session in sync across tabs / token refreshes.
    const {
      data: { subscription },
    } = onAuthStateChange(async (event, incomingSession) => {
      if (cancelled) return;
      const s = incomingSession as Session | null;

      if (event === "SIGNED_OUT") {
        // Session ended (sign-out or refresh token expired) — clear everything.
        setSession(null);
        setSystemRole(null);
        setLoading(false);
        return;
      }

      if (event === "TOKEN_REFRESHED") {
        // Update React state with the fresh session object so components always
        // hold a valid access token. OrgContext watches userId (not session),
        // so this will NOT trigger a needless org re-fetch.
        setSession(s);
        return;
      }

      // For SIGNED_IN / USER_UPDATED / INITIAL_SESSION — only update when the
      // user identity actually changes to avoid duplicate OrgContext fetches.
      setSession((prev) => {
        const prevId = prev?.user?.id ?? null;
        const nextId = s?.user?.id ?? null;
        if (prevId === nextId) return prev;
        return s;
      });
      if (s) {
        const { data } = await getSystemRole(s.user.id);
        if (!cancelled) setSystemRole(data);
      } else {
        setSystemRole(null);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ session, systemRole, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
