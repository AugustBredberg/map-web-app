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
    // Get the current session on mount
    getSession().then(async ({ session }) => {
      setSession(session);
      if (session) {
        const { data } = await getSystemRole(session.user.id);
        setSystemRole(data);
      }
      setLoading(false);
    });

    // Keep session in sync across tabs / token refreshes.
    // Only update state when the user actually changes (sign-in / sign-out) —
    // ignore token refresh events where the user id is identical, otherwise
    // OrgContext re-runs its fetch on every tab focus.
    const {
      data: { subscription },
    } = onAuthStateChange(async (_event, incomingSession) => {
      const s = incomingSession as Session | null;
      setSession((prev) => {
        const prevId = prev?.user?.id ?? null;
        const nextId = s?.user?.id ?? null;
        if (prevId === nextId) return prev; // same user — no state change needed
        return s;
      });
      if (s) {
        const { data } = await getSystemRole(s.user.id);
        setSystemRole(data);
      } else {
        setSystemRole(null);
      }
    });

    return () => subscription.unsubscribe();
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
