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

interface AuthContextValue {
  session: Session | null;
  /** True while the initial session is being fetched */
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  session: null,
  loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get the current session on mount
    getSession().then(({ session }) => {
      setSession(session);
      setLoading(false);
    });

    // Keep session in sync across tabs / token refreshes
    const {
      data: { subscription },
    } = onAuthStateChange((_event, session) => {
      setSession(session as Session | null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ session, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
