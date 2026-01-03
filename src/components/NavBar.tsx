// components/NavBar.tsx
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";

export default function NavBar() {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/"); // back to login
  };

  return (
    <nav
      style={{
        background: "rgba(255, 255, 255, 0.8)",
        backdropFilter: "blur(10px)",
        borderBottom: "1px solid rgba(0,0,0,0.05)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
        padding: "0.75rem 2rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      {/* Left: Logo */}
      <div
        style={{
          fontWeight: "800",
          fontSize: "1.25rem",
          letterSpacing: "-0.02em",
          color: "#3f37c9",
          cursor: "pointer",
        }}
        onClick={() => router.push("/dashboard")}
      >
        StudySmart
      </div>

      {/* Center: Nav Links */}
      <div style={{ display: "flex", gap: "1.5rem" }}>
        <button onClick={() => router.push("/dashboard")} style={navButtonStyle}>
          Dashboard
        </button>
        <button onClick={() => router.push("/flashcards")} style={navButtonStyle}>
          Flashcards
        </button>
        <button onClick={() => router.push("/quizzes")} style={navButtonStyle}>
          Quizzes
        </button>
        <button onClick={() => router.push("/profile")} style={navButtonStyle}>
          Profile
        </button>
      </div>

      {/* Right: Logout */}
      <button
        onClick={handleLogout}
        style={{
          padding: "8px 16px",
          borderRadius: "8px",
          background: "#ef4444",
          color: "#fff",
          border: "none",
          cursor: "pointer",
          fontWeight: "600",
          transition: "background 0.2s ease",
        }}
      >
        Logout
      </button>
    </nav>
  );
}

const navButtonStyle: React.CSSProperties = {
  background: "transparent",
  border: "none",
  fontSize: "1rem",
  fontWeight: 600,
  cursor: "pointer",
  color: "#374151",
  transition: "color 0.2s ease",
};
