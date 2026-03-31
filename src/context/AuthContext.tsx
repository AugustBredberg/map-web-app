"use client";

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { getSession, onAuthStateChange } from "@/lib/auth";
import { getProfileFlags } from "@/lib/profiles";
import type { SignupSource, SystemRole } from "@/lib/supabase";

interface AuthContextValue {
  session: Session | null;
  /** System-level role (cross-org). null means regular user. */
  systemRole: SystemRole | null;
  /** Signup intent from profile (landing vs invite). */
  signupSource: SignupSource;
  /** True while the initial session is being fetched */
  loading: boolean;
  /** Re-fetch profile flags (e.g. after accept-invite updates signup_source). */
  refreshProfile: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  session: null,
  systemRole: null,
  signupSource: "unknown",
  loading: true,
  refreshProfile: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [systemRole, setSystemRole] = useState<SystemRole | null>(null);
  const [signupSource, setSignupSource] = useState<SignupSource>("unknown");
  /** Initial getSession + first profile load */
  const [bootLoading, setBootLoading] = useState(true);
  /** Profile flags after sign-in / tab switch to another user (avoids routing on stale signup_source) */
  const [profileSwitchLoading, setProfileSwitchLoading] = useState(false);

  const loading = bootLoading || profileSwitchLoading;

  const refreshProfile = useCallback(() => {
    void getSession().then(({ session: s }) => {
      const uid = s?.user?.id;
      if (!uid) return;
      void getProfileFlags(uid).then(({ data }) => {
        setSystemRole(data.systemRole);
        setSignupSource(data.signupSource);
      });
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    let lastSessionUserId: string | null = null;

    // Fetch profile flags outside the auth callback to avoid deadlocking Supabase's session lock.
    const fetchProfileFlagsAfterSwitch = (userId: string) => {
      setProfileSwitchLoading(true);
      getProfileFlags(userId).then(({ data }) => {
        if (!cancelled) {
          setSystemRole(data.systemRole);
          setSignupSource(data.signupSource);
        }
        if (!cancelled) setProfileSwitchLoading(false);
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
          const { data } = await getProfileFlags(initialSession.user.id);
          if (!cancelled) {
            setSystemRole(data.systemRole);
            setSignupSource(data.signupSource);
            lastSessionUserId = initialSession.user.id;
          }
        }
      } catch (err) {
        console.error("[AuthContext] Failed to load initial session:", err);
      } finally {
        if (!cancelled) setBootLoading(false);
      }
    };

    void boot();

    // Keep session in sync across tabs / token refreshes.
    //
    // IMPORTANT: This callback is invoked by Supabase's _notifyAllSubscribers
    // which runs **inside** an internal navigator lock.  Any Supabase query
    // (including getSession()) also needs that lock, so awaiting a query here
    // would deadlock.  Always schedule Supabase calls outside the callback
    // (fire-and-forget via fetchProfileFlags).
    const {
      data: { subscription },
    } = onAuthStateChange((event, incomingSession) => {
      if (cancelled) return;
      const s = incomingSession as Session | null;

      if (event === "SIGNED_OUT") {
        setSession(null);
        setSystemRole(null);
        setSignupSource("unknown");
        setBootLoading(false);
        setProfileSwitchLoading(false);
        lastSessionUserId = null;
        return;
      }

      if (event === "TOKEN_REFRESHED") {
        setSession(s);
        return;
      }

      // SIGNED_IN / USER_UPDATED / INITIAL_SESSION
      const nextId = s?.user?.id ?? null;
      const shouldFetchProfile = Boolean(nextId && lastSessionUserId !== nextId);
      setSession((prev) => {
        const prevId = prev?.user?.id ?? null;
        if (!s) {
          return null;
        }
        if (prevId === nextId) return prev;
        return s;
      });
      if (shouldFetchProfile && nextId) {
        lastSessionUserId = nextId;
        fetchProfileFlagsAfterSwitch(nextId);
      }
      if (!s) {
        lastSessionUserId = null;
        setSystemRole(null);
        setSignupSource("unknown");
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
    <AuthContext.Provider value={{ session, systemRole, signupSource, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
