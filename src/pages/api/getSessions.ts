import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { data, error } = await supabase
      .from("study_sessions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      throw error;
    }

    res.status(200).json(data);
  } catch (err) {
    console.error("Failed to fetch study sessions:", err);
    res.status(500).json({ error: "Failed to fetch sessions" });
  }
}
