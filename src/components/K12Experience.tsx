import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useUser } from "@supabase/auth-helpers-react";
import { gradeBandFor, type GradeBand } from "@/lib/learningProfile";

type Experience = {
  gradeLevel: string | null;
  gradeBand: GradeBand | null;
  labels: { dashboard: string; tutor: string; study: string };
};

const DEFAULT_LABELS = { dashboard: "Dashboard", tutor: "Tutor", study: "Study" };
const ExperienceContext = createContext<Experience>({
  gradeLevel: null,
  gradeBand: null,
  labels: DEFAULT_LABELS,
});

export function K12ExperienceProvider({ children }: { children: React.ReactNode }) {
  const user = useUser();
  const [gradeLevel, setGradeLevel] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {setGradeLevel(null); return;}
    Promise.all([
      fetch("/api/profile/learning-context").then((response) => response.json()),
      fetch("/api/trust").then((response) => response.json()),
    ])
      .then(([profileData, trustData]) => {
        setGradeLevel(profileData.profile?.gradeLevel ?? null);
        const settings = trustData.settings;
        if (settings) {
          document.body.dataset.textScale = settings.textScale ?? "DEFAULT";
          document.body.dataset.reduceMotion = String(Boolean(settings.reduceMotion));
          document.body.dataset.highContrast = String(Boolean(settings.highContrast));
          document.body.dataset.readingFont = String(Boolean(settings.readingFont));
        }
      })
      .catch(() => setGradeLevel(null));
  }, [user]);

  const value = useMemo<Experience>(() => {
    const gradeBand = gradeLevel ? gradeBandFor(gradeLevel) : null;
    const labels = gradeBand === "EARLY"
      ? { dashboard: "My learning adventure", tutor: "Learning helper", study: "Practice" }
      : gradeBand === "ELEMENTARY"
        ? { dashboard: "My learning path", tutor: "Learning coach", study: "Practice" }
        : DEFAULT_LABELS;
    return { gradeLevel, gradeBand, labels };
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
