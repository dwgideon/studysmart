import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      topic,
      score,
      total,
      flashcardsCount,
      createdAt,
    } = req.body;

    const { error } = await supabase.from("study_sessions").insert([
      {
        topic,
        score,
        total,
        flashcards_count: flashcardsCount,
        created_at: createdAt || new Date().toISOString(),
      },
    ]);

    if (error) throw error;

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Save session error:", err);
    res.status(500).json({ error: "Failed to save session" });
  }
}
