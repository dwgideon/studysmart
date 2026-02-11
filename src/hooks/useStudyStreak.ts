import { useEffect, useState } from "react";

type StreakData = {
  currentStreak: number;
  longestStreak: number;
  lastStudyDate: string | null;
};

export function useStudyStreak() {
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/streak");
      const data = await res.json();
      setStreak(data);
      setLoading(false);
    }
    load();
  }, []);

  return { streak, loading };
}
