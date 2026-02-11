// pages/api/saveNote.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const { title, content, userId } = req.body;

  if (!title || !content || !userId) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const note = await prisma.notes.create({
      data: {
        title,
        content,
        user_id: userId,
      },
    });

    return res.status(200).json(note);
  } catch (error) {
    console.error("saveNote error:", error);
    return res.status(500).json({ error: "Failed to save note" });
  }
}
