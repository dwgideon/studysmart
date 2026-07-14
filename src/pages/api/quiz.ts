import type { NextApiRequest, NextApiResponse } from "next";
import { openai } from "@/lib/openai";
import { parseAiJson } from "@/lib/parseAiJson";
import { requireApiUser } from "@/lib/auth";
import { enrichQuestionsWithConcepts } from "@/lib/concepts";
import { prisma } from "@/lib/prisma";
import { aiAccessForUser, K12_SAFETY_PROMPT, moderateK12Content } from "@/lib/childSafety";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {return res.status(405).end();}

  const user = await requireApiUser(req, res);
  if (!user) {return;}

  try {
    const { lesson } = req.body;
    const access = await aiAccessForUser(user.id);
    if (!access.allowed) {return res.status(428).json({ error: access.reason });}
    const profile = await prisma.learnerProfile.findUnique({ where: { userId: user.id } });

    if (!lesson) {
      return res.status(400).json({ error: "Missing lesson text" });
    }
    const safety = await moderateK12Content(user.id, lesson, "QUIZ_INPUT");
    if (!safety.allowed) {
      return res.status(safety.lockedUntil ? 423 : 422).json({
        code: safety.lockedUntil ? "LEARNING_LOCKED" : "CONTENT_BLOCKED",
        error: safety.safeResponse,
        strikeCount: safety.strikeCount,
        lockedUntil: safety.lockedUntil,
      });
    }

    const wordCount = lesson.split(/\s+/).length;
    let questionCount = Math.round(wordCount / 80);
    if (questionCount < 5) {questionCount = 5;}
    if (questionCount > 20) {questionCount = 20;}

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.4,
      max_tokens: 1500,
      messages: [
        {
          role: "system",
          content: `${K12_SAFETY_PROMPT}\n\nCreate a ${questionCount}-question multiple-choice quiz for a grade ${profile?.gradeLevel ?? "6"} student. Use age-appropriate vocabulary and challenge. Each question must contain: question, options A-D, answer letter, explanation, and a short reusable concept label. Respond ONLY with JSON: {"questions":[...]}`,
        },
        { role: "user", content: lesson.slice(0, 12_000) },
      ],
    });

    const raw = completion.choices[0].message?.content;
    const outputSafety = await moderateK12Content(user.id, raw ?? "", "QUIZ_OUTPUT");
    if (!outputSafety.allowed) {return res.status(422).json({ error: "The generated quiz did not pass the K–12 safety check." });}
    const parsed = parseAiJson<{ questions: unknown[] }>(raw);

    if (!parsed?.questions?.length) {
      return res.status(500).json({ error: "Quiz generation failed" });
    }

    const enriched = await enrichQuestionsWithConcepts(user.id, parsed.questions);
    return res.status(200).json(enriched);
  } catch (err) {
    console.error("Quiz API error:", err);
    return res.status(500).json({ error: "AI quiz failed." });
  }
}
