import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useUser } from "@supabase/auth-helpers-react";
import { experienceForGrade, type GradeBand, type K12ExperienceConfig } from "@/lib/learningProfile";
import { supabase } from "@/lib/supabaseClient";

type Experience = {
  gradeLevel: string | null;
  gradeBand: GradeBand | null;
  config: K12ExperienceConfig | null;
  labels: { dashboard: string; tutor: string; study: string };
};

const DEFAULT_LABELS = { dashboard: "Dashboard", tutor: "Tutor", study: "Study" };
const ExperienceContext = createContext<Experience>({
  gradeLevel: null,
  gradeBand: null,
  config: null,
  labels: DEFAULT_LABELS,
});

export function K12ExperienceProvider({ children }: { children: React.ReactNode }) {
  const user = useUser();
  const [gradeLevel, setGradeLevel] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function loadExperience() {
      const sessionUser = user ?? (await supabase.auth.getSession()).data.session?.user;
      if (!sessionUser) {
        if (active) {setGradeLevel(null);}
        return;
      }
      const profileRequest = fetch("/api/profile/learning-context", { cache: "no-store" });
      const trustRequest = fetch("/api/trust", { cache: "no-store" });
      const profileResponse = await profileRequest;
      if (!profileResponse.ok) {
        throw new Error("The K–12 experience could not be loaded.");
      }
      const profileData = await profileResponse.json();
      if (active) {
        setGradeLevel(profileData.profile?.gradeLevel ?? null);
      }
      const trustResponse = await trustRequest;
      if (!trustResponse.ok) {
        throw new Error("Accessibility preferences could not be loaded.");
      }
      const trustData = await trustResponse.json();
      if (active) {
        const settings = trustData.settings;
        if (settings) {
          document.body.dataset.textScale = settings.textScale ?? "DEFAULT";
          document.body.dataset.reduceMotion = String(Boolean(settings.reduceMotion));
          document.body.dataset.highContrast = String(Boolean(settings.highContrast));
          document.body.dataset.readingFont = String(Boolean(settings.readingFont));
        }
      }
    }
    void loadExperience().catch(() => {
      if (active) {setGradeLevel(null);}
    });
    return () => {active = false;};
  }, [user]);

  const value = useMemo<Experience>(() => {
    const config = gradeLevel ? experienceForGrade(gradeLevel) : null;
    return {
      gradeLevel,
      gradeBand: config?.band ?? null,
      config,
      labels: config?.labels ?? DEFAULT_LABELS,
    };
  }, [gradeLevel]);

  useEffect(() => {
    if (value.gradeBand) {document.body.dataset.gradeBand = value.gradeBand;}
    else {delete document.body.dataset.gradeBand;}
    return () => {delete document.body.dataset.gradeBand;};
  }, [value.gradeBand]);

  return <ExperienceContext.Provider value={value}>{children}</ExperienceContext.Provider>;
}

export function useK12Experience() {
  return useContext(ExperienceContext);
}
