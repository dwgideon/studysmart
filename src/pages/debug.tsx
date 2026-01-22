import { useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

export default function DebugPage() {
  useEffect(() => {
    const testInsert = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const userId = user?.id;

      if (!userId) {
        console.log("No user logged in");
        return;
      }

      const { error } = await supabase.from("notes").insert({
        user_id: userId,
        title: "Test note",
        content: "Hello from debug page",
      });

      console.log("Insert result:", error ?? "success");
    };

    testInsert();
  }, []);

  return <div>Debug Page — check console</div>;
}