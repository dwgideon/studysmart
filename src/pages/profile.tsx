import Sidebar from "../components/Sidebar";
import { useUser } from "@supabase/auth-helpers-react";
import { useState } from "react";

/* ---------- Types ---------- */

type UserStats = {
  sessions: number;
  sessionChange: number;
  flashcards: number;
  flashcardChange: number;
  quizzes: number;
  quizChange: number;
  mastery: number;
  masteryChange: number;
};

type ActivityItem = {
  title: string;
  subtitle: string;
  time: string;
};

type StatCard = {
  label: string;
  value: string | number;
  change: number;
  icon: string;
};

/* ---------- Component ---------- */

export default function ProfilePage() {
  const user = useUser();

  const [userStats] = useState<UserStats>({
    sessions: 24,
    sessionChange: 12,
    flashcards: 156,
    flashcardChange: 8,
    quizzes: 18,
    quizChange: -3,
    mastery: 78,
    masteryChange: 5,
  });

  const [activity] = useState<ActivityItem[]>([
    { title: "Completed Flashcard Review", subtitle: "Biology - Cell Structure", time: "2h ago" },
    { title: "Quiz Attempted", subtitle: "Trigonometry Basics", time: "1 day ago" },
  ]);

  const statCards: StatCard[] = [
    { label: "Study Sessions", value: userStats.sessions, change: userStats.sessionChange, icon: "🕒" },
    { label: "Flashcards", value: userStats.flashcards, change: userStats.flashcardChange, icon: "📚" },
    { label: "Quizzes Taken", value: userStats.quizzes, change: userStats.quizChange, icon: "❓" },
    { label: "Mastery Level", value: `${userStats.mastery}%`, change: userStats.masteryChange, icon: "⭐" },
  ];

  const displayName =
    (user as any)?.user_metadata?.name ||
    (user as any)?.email ||
    "Alex";

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1 p-8">
        <h2 className="text-2xl font-semibold mb-1">
          Welcome back, {displayName}
        </h2>

        <p className="text-gray-600 mb-6">
          Here's your personalized learning dashboard powered by AI.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {statCards.map((stat, i) => (
            <div key={i} className="bg-white rounded-lg p-6 shadow">
              <div className="text-gray-500 text-sm mb-1">{stat.label}</div>

              <div className="text-2xl font-semibold">
                {stat.icon} {stat.value}
              </div>

              <div
                className={`text-sm mt-1 ${
                  stat.change >= 0 ? "text-green-600" : "text-red-500"
                }`}
              >
                {stat.change >= 0 ? "+" : ""}
                {stat.change}% from last week
              </div>
            </div>
          ))}
        </div>

        <div className="mb-10">
          <h3 className="text-lg font-semibold mb-3">Recent Activity</h3>

          <div className="bg-white shadow rounded-lg divide-y">
            {activity.map((a, i) => (
              <div key={i} className="p-4 flex justify-between">
                <div>
                  <div className="font-medium">{a.title}</div>
                  <div className="text-gray-500 text-sm">{a.subtitle}</div>
                </div>
                <div className="text-sm text-gray-400">{a.time}</div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-3">Suggested Study</h3>
          <div className="bg-white rounded-lg shadow p-6 text-gray-600">
            AI-powered suggestions will appear here based on your progress.
          </div>
        </div>
      </main>
    </div>
  );
}
