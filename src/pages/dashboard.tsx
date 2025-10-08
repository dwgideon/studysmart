"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { getMonthlyUsage } from "@/lib/usage"; // we'll create this helper next
import styles from "@/styles/Dashboard.module.css";

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [usage, setUsage] = useState<number>(0);
  const [limit, setLimit] = useState<number>(100000); // tokens per month
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserAndUsage = async () => {
      setLoading(true);
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;

      setUser(userData.user);

      const usageData = await getMonthlyUsage(userData.user.id);
      setUsage(usageData.tokensUsed || 0);

      setLoading(false);
    };

    fetchUserAndUsage();
  }, []);

  const percentUsed = Math.min((usage / limit) * 100, 100);

  return (
    <div className={styles.dashboardContainer}>
      <header className={styles.header}>
        <h1>Welcome back, {user?.email || "Student"} 👋</h1>
        <p>Let’s keep learning smarter — not harder.</p>
      </header>

      {loading ? (
        <div className={styles.loading}>Loading your data...</div>
      ) : (
        <>
          <section className={styles.usageSection}>
            <h2>Monthly AI Usage</h2>
            <div className={styles.usageBar}>
              <div
                className={styles.usageFill}
                style={{
                  width: `${percentUsed}%`,
                  background:
                    percentUsed > 80
                      ? "linear-gradient(90deg, #ff6b6b, #ff8787)"
                      : "linear-gradient(90deg, #4facfe, #00f2fe)",
                }}
              />
            </div>
            <p>
              {usage.toLocaleString()} / {limit.toLocaleString()} tokens used
            </p>
          </section>

          <section className={styles.actionsSection}>
            <h2>Quick Actions</h2>
            <div className={styles.actionGrid}>
              <button
                onClick={() => (window.location.href = "/index")}
                className={styles.actionCard}
              >
                📘 Upload Study Material
              </button>
              <button
                onClick={() => (window.location.href = "/flashcards")}
                className={styles.actionCard}
              >
                🎴 View Flashcards
              </button>
              <button
                onClick={() => (window.location.href = "/quizzes")}
                className={styles.actionCard}
              >
                🧠 Take a Quiz
              </button>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
