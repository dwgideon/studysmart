// pages/api/saveNote.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const { title, content, userId } = req.body;

  if (!title || !content || !userId) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const note = await prisma.note.create({
      data: { title, content, userId },
    });
    res.status(200).json(note);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save note" });
  }
}
