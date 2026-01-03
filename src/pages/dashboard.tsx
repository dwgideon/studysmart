import { useEffect, useState } from "react";
import Layout from "@/components/Layout";

export default function Dashboard() {
  const [streak, setStreak] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch("/api/study/stats");
        const data: { streak: number } = await res.json();
        setStreak(data.streak);
      } catch (err) {
        console.error("Failed to load stats", err);
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  return (
    <Layout>
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>

        {/* STREAK CARD */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white p-6 shadow-lg">
            <div className="text-sm uppercase tracking-wide opacity-90">
              Study Streak
            </div>
            <div className="text-4xl font-extrabold mt-2">
              {loading ? "…" : `🔥 ${streak} day${streak === 1 ? "" : "s"}`}
            </div>
          </div>

          {/* PLACEHOLDERS FOR NEXT FEATURES */}
          <div className="rounded-xl bg-gray-100 p-6">
            <div className="text-sm uppercase tracking-wide text-gray-500">
              XP
            </div>
            <div className="text-3xl font-bold mt-2 text-gray-800">
              Coming Next
            </div>
          </div>

          <div className="rounded-xl bg-gray-100 p-6">
            <div className="text-sm uppercase tracking-wide text-gray-500">
              Accuracy
            </div>
            <div className="text-3xl font-bold mt-2 text-gray-800">
              Coming Next
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
