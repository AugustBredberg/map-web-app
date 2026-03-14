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

    // Fetch the system role outside the auth callback to avoid deadlocking
    // Supabase's internal session lock (the callback runs inside that lock,
    // and any Supabase query also needs the lock → circular wait).
    const fetchSystemRole = (userId: string) => {
      getSystemRole(userId).then(({ data }) => {
        if (!cancelled) setSystemRole(data);
      });
    };

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
    //
    // IMPORTANT: This callback is invoked by Supabase's _notifyAllSubscribers
    // which runs **inside** an internal navigator lock.  Any Supabase query
    // (including getSession()) also needs that lock, so awaiting a query here
    // would deadlock.  Always schedule Supabase calls outside the callback
    // (fire-and-forget via fetchSystemRole).
    const {
      data: { subscription },
    } = onAuthStateChange((event, incomingSession) => {
      if (cancelled) return;
      const s = incomingSession as Session | null;

      if (event === "SIGNED_OUT") {
        setSession(null);
        setSystemRole(null);
        setLoading(false);
        return;
      }

      if (event === "TOKEN_REFRESHED") {
        setSession(s);
        return;
      }

      // SIGNED_IN / USER_UPDATED / INITIAL_SESSION
      // Only update state when the user identity actually changes.
      setSession((prev) => {
        const prevId = prev?.user?.id ?? null;
        const nextId = s?.user?.id ?? null;
        if (prevId === nextId) return prev;
        return s;
      });
      if (s) {
        fetchSystemRole(s.user.id);
      } else {
        setSystemRole(null);
      }
    });

    // No custom visibilitychange handler needed — the Supabase client already
    // recovers the session when the tab regains focus (via its built-in
    // _onVisibilityChanged → _recoverAndRefresh flow).

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
