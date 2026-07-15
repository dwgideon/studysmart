import type { NextApiRequest, NextApiResponse } from "next";
import { openai } from "@/lib/openai";
import { parseAiJson } from "@/lib/parseAiJson";
import { requireApiUser } from "@/lib/auth";
import { enrichQuestionsWithConcepts } from "@/lib/concepts";
import { prisma } from "@/lib/prisma";
import { aiAccessForUser, K12_SAFETY_PROMPT, moderateK12Content } from "@/lib/childSafety";
import { generateLocalQuiz, isAiFreeTestMode } from "@/lib/aiFreeTestMode";

function calculateQuestionCount(text: string) {
  const wordCount = text.split(/\s+/).length;
  let count = Math.round(wordCount / 80);
  if (count < 5) {count = 5;}
  if (count > 25) {count = 25;}
  return count;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {return res.status(405).end();}

  const user = await requireApiUser(req, res);
  if (!user) {return;}

  try {
    const { content, title } = req.body;
    const access = isAiFreeTestMode ? null : await aiAccessForUser(user.id);
    if (access && !access.allowed) {return res.status(428).json({ error: access.reason });}
    const profile = await prisma.learnerProfile.findUnique({ where: { userId: user.id } });

    if (!content || typeof content !== "string") {
      return res.status(400).json({ error: "Missing lesson content" });
    }
    const safety = await moderateK12Content(user.id, content, "QUIZ_BUILDER_INPUT");
    if (!safety.allowed) {
      return res.status(safety.lockedUntil ? 423 : 422).json({
        code: safety.lockedUntil ? "LEARNING_LOCKED" : "CONTENT_BLOCKED",
        error: safety.safeResponse,
        strikeCount: safety.strikeCount,
        lockedUntil: safety.lockedUntil,
      });
    }

    const questionCount = calculateQuestionCount(content);

    let questions: unknown[];
    if (isAiFreeTestMode) {
      questions = generateLocalQuiz(content, questionCount);
    } else {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.4,
        max_tokens: 1500,
        messages: [
          {
            role: "system",
            content: `${K12_SAFETY_PROMPT}\n\nCreate exactly ${questionCount} multiple-choice questions for a grade ${profile?.gradeLevel ?? "6"} student. Match vocabulary and challenge to that age. JSON only: {"questions":[{"question":"","options":{"A":"","B":"","C":"","D":""},"answer":"A","explanation":"","concept":"short reusable topic label"}]}`,
          },
          { role: "user", content: content.slice(0, 12_000) },
        ],
      });
      const raw = completion.choices[0].message?.content;
      const outputSafety = await moderateK12Content(user.id, raw ?? "", "QUIZ_BUILDER_OUTPUT");
      if (!outputSafety.allowed) {return res.status(422).json({ error: "The generated quiz did not pass the K–12 safety check." });}
      questions = parseAiJson<{ questions: unknown[] }>(raw)?.questions ?? [];
    }

    if (!questions.length) {
      return res.status(500).json({ error: "Invalid quiz data from AI" });
    }

    const enriched = await enrichQuestionsWithConcepts(user.id, questions);
    return res.status(200).json({
      title: title ?? "Custom quiz",
      totalQuestions: enriched.questions.length,
      ...enriched,
    });
  } catch (err) {
    console.error("Generate quiz error:", err);
    return res.status(500).json({ error: "Failed to generate quiz" });
  }
}
