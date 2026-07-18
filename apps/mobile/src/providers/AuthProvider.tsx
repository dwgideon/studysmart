import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { registerMobileDevice, revokeMobileDevice } from "@/lib/device";
import { clearOfflineLearnerData, flushSyncQueue } from "@/lib/offline";

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active) {setSession(data.session); setLoading(false);}
    });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setLoading(false);
    });
    return () => {active = false; data.subscription.unsubscribe();};
  }, []);

  useEffect(() => {
    if (!session) {return;}
    registerMobileDevice(false).then(() => flushSyncQueue()).catch(() => undefined);
  }, [session]);

  const value = useMemo<AuthContextValue>(() => ({
    session,
    user: session?.user ?? null,
    loading,
    signIn: async (email, password) => {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) {throw error;}
    },
    signOut: async () => {
      await revokeMobileDevice().catch(() => undefined);
      await clearOfflineLearnerData();
      const { error } = await supabase.auth.signOut();
      if (error) {throw error;}
    },
  }), [loading, session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {throw new Error("useAuth must be used within AuthProvider");}
  return value;
}
