import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { openai } from "@/lib/openai";
import { parseAiJson } from "@/lib/parseAiJson";
import { requireApiUser } from "@/lib/auth";
import { aiAccessForUser, K12_SAFETY_PROMPT, moderateK12Content } from "@/lib/childSafety";

type TrueFalseQuestion = {
  statement: string;
  answer: boolean;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {return res.status(405).end();}

  const user = await requireApiUser(req, res);
  if (!user) {return;}

  try {
    const access = await aiAccessForUser(user.id);
    if (!access.allowed) {return res.status(428).json({ error: access.reason });}
    const cards = await prisma.flashcard.findMany({
      where: { userId: user.id },
      take: 30,
    });

    const notes = await prisma.note.findMany({
      where: { userId: user.id },
      take: 5,
    });

    const text =
      cards.map((c) => `${c.question}\n${c.answer}`).join("\n\n") ||
      notes.map((n) => n.content).join("\n\n");

    if (!text.trim()) {
      return res.status(400).json({
        error: "Add notes or flashcards first to play True/False.",
      });
    }
    const safety = await moderateK12Content(user.id, text, "TRUE_FALSE_INPUT");
    if (!safety.allowed) {
      return res.status(safety.lockedUntil ? 423 : 422).json({
        code: safety.lockedUntil ? "LEARNING_LOCKED" : "CONTENT_BLOCKED",
        error: safety.safeResponse,
        strikeCount: safety.strikeCount,
        lockedUntil: safety.lockedUntil,
      });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.5,
      max_tokens: 800,
      messages: [
        {
          role: "system",
          content:
            `${K12_SAFETY_PROMPT}\n\nCreate 8 age-appropriate true/false statements from the content. JSON only: {"questions":[{"statement":"","answer":true}]}`,
        },
        { role: "user", content: text.slice(0, 8000) },
      ],
    });

    const raw = completion.choices[0].message?.content;
    const outputSafety = await moderateK12Content(user.id, raw ?? "", "TRUE_FALSE_OUTPUT");
    if (!outputSafety.allowed) {return res.status(422).json({ error: "The generated game did not pass the K–12 safety check." });}
    const parsed = parseAiJson<{ questions: TrueFalseQuestion[] }>(raw);

    if (!parsed?.questions?.length) {
      return res.status(500).json({ error: "Failed to generate questions" });
    }

    return res.status(200).json({ questions: parsed.questions });
  } catch (err) {
    console.error("true-false error:", err);
    return res.status(500).json({ error: "Game generation failed" });
  }
}
