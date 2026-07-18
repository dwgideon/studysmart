import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";
import { apiFetch } from "@/lib/api";
import type { GameHub } from "@/lib/types";
import { useAuth } from "@/providers/AuthProvider";

type ExperienceValue = {
  hub: GameHub | null;
  loading: boolean;
  refresh: () => Promise<void>;
  elementary: boolean;
};

const ExperienceContext = createContext<ExperienceValue | null>(null);

export function ExperienceProvider({ children }: PropsWithChildren) {
  const { session, loading: authLoading } = useAuth();
  const [hub, setHub] = useState<GameHub | null>(null);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    try {setHub(await apiFetch<GameHub>("/api/games/hub"));}
    finally {setLoading(false);}
  }, []);
  useEffect(() => {
    if (authLoading) {return;}
    if (!session) {setHub(null); setLoading(false); return;}
    setLoading(true);
    refresh().catch(() => setLoading(false));
  }, [authLoading, refresh, session]);
  const value = useMemo(() => ({
    hub,
    loading,
    refresh,
    elementary: hub ? ["EARLY", "ELEMENTARY"].includes(hub.experience.gradeBand) : false,
  }), [hub, loading, refresh]);
  return <ExperienceContext.Provider value={value}>{children}</ExperienceContext.Provider>;
}

export function useExperience() {
  const value = useContext(ExperienceContext);
  if (!value) {throw new Error("useExperience must be used within ExperienceProvider");}
  return value;
}
