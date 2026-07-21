import type { NextApiRequest, NextApiResponse } from "next";
import { openai } from "@/lib/openai";
import { parseAiJson } from "@/lib/parseAiJson";
import { requireApiUser } from "@/lib/auth";
import { enrichQuestionsWithConcepts } from "@/lib/concepts";
import { prisma } from "@/lib/prisma";
import { aiAccessForUser, K12_SAFETY_PROMPT, moderateK12Content } from "@/lib/childSafety";
import { generateLocalQuiz, isAiFreeTestMode } from "@/lib/aiFreeTestMode";
import { AiCreditLimitError, aiCreditErrorResponse, withAiCredits } from "@/lib/aiCredits";
import { AI_CREDIT_COSTS } from "@/lib/plans";

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

    let questions: unknown[];
    if (isAiFreeTestMode) {
      questions = generateLocalQuiz(content);
    } else {
      const completion = await withAiCredits(
        { userId: user.id, feature: "QUIZ_BUILDER", model: "gpt-4o-mini", credits: AI_CREDIT_COSTS.quiz },
        () => openai.chat.completions.create({
          model: "gpt-4o-mini",
          temperature: 0.4,
          max_tokens: 12000,
          messages: [
            {
              role: "system",
              content: `${K12_SAFETY_PROMPT}\n\nFirst determine how many multiple-choice questions this material needs for effective learning and retrieval practice. Use one question per distinct, testable learning objective or important relationship. Short material may need 5–10 questions; broad material may need dozens or up to 100. Do not default to a fixed count, and avoid redundant questions. Create age-appropriate questions for a grade ${profile?.gradeLevel ?? "6"} student. JSON only: {"questions":[{"question":"","options":{"A":"","B":"","C":"","D":""},"answer":"A","explanation":"","concept":"short reusable topic label"}]}`,
            },
            { role: "user", content: content.slice(0, 100_000) },
          ],
        })
      );
      const raw = completion.choices[0].message?.content;
      const outputSafety = await moderateK12Content(user.id, raw ?? "", "QUIZ_BUILDER_OUTPUT");
      if (!outputSafety.allowed) {return res.status(422).json({ error: "The generated quiz did not pass the K–12 safety check." });}
      questions = (parseAiJson<{ questions: unknown[] }>(raw)?.questions ?? []).slice(0, 100);
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
    if (err instanceof AiCreditLimitError) {
      return res.status(402).json(aiCreditErrorResponse(err));
    }
    console.error("Generate quiz error:", err);
    return res.status(500).json({ error: "Failed to generate quiz" });
  }
}
