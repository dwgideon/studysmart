import { useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

export default function DebugPage() {
  useEffect(() => {
    const test = async () => {
      const { data, error } = await supabase.from("notes").select("*").limit(1);
      console.log("Debug DB:", data, error);
    };
    test();
  }, []);

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Debug Page</h1>
      <p>Check console for Supabase results.</p>
    </div>
  );
}
