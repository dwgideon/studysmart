import { Flame } from "lucide-react";
import { useStudyStreak } from "@/hooks/useStudyStreak";

export default function StreakCard() {
  const { streak, loading } = useStudyStreak();

  if (loading) {
    return (
      <div className="p-6 rounded-xl bg-gray-100 animate-pulse h-28" />
    );
  }

  if (!streak) return null;

  return (
    <div className="p-6 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md">
      <div className="flex items-center gap-3">
        <Flame size={32} />
        <div>
          <div className="text-2xl font-bold">
            {streak.currentStreak} Day Streak
          </div>
          <div className="text-sm opacity-90">
            Longest: {streak.longestStreak} days
          </div>
        </div>
      </div>
    </div>
  );
}
