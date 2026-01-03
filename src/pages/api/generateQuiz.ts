// src/pages/api/generateQuiz.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { openai } from "@/lib/openai";

/**
 * Auto-scales question count based on lesson size:
 * ~1 question per 80 words
 * Min 5 questions, Max 40 (safe token limit)
 */
function calculateQuestionCount(text: string) {
  const wordCount = text.split(/\s+/).length;

  let count = Math.round(wordCount / 80);

  if (count < 5) count = 5;
  if (count > 40) count = 40;

  return count;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  try {
    const { content, grade = "middle" } = req.body;

    if (!content || typeof content !== "string") {
      return res.status(400).json({ error: "Missing lesson content" });
    }

    const questionCount = calculateQuestionCount(content);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.4,
      max_tokens: 1500,
      messages: [
        {
          role: "system",
          content: `
Create a multiple-choice quiz for a ${grade}-level student.

Generate exactly ${questionCount} questions.

Rules:
- Each question must have:
  - "question"
  - "options" with keys "A", "B", "C", "D"
  - "answer" (single letter: A/B/C/D)
  - "explanation" (1–2 sentences, kid friendly)

⚠️ IMPORTANT:
Respond ONLY with valid JSON using EXACTLY this structure:

{
  "questions": [
    {
      "question": "",
      "options": {
        "A": "",
        "B": "",
        "C": "",
        "D": ""
      },
      "answer": "",
      "explanation": ""
    }
  ]
}

Do NOT include markdown, commentary, or any text outside the JSON.
`
        },
        {
          role: "user",
          content: content.slice(0, 12_000),
        },
      ],
    });

    const raw = completion.choices[0].message.content;

    let parsed;
    try {
      parsed = JSON.parse(raw ?? "{}");
    } catch (err) {
      console.error("Quiz JSON parse failed:", raw);

      return res.status(500).json({
        error: "Quiz JSON formatting error",
      });
    }

    if (!parsed || !Array.isArray(parsed.questions)) {
      return res.status(500).json({
        error: "Invalid quiz data returned from AI",
      });
    }

    return res.status(200).json({
      totalQuestions: parsed.questions.length,
      questions: parsed.questions,
    });

  } catch (err) {
    console.error("Generate quiz error:", err);

    return res.status(500).json({
      error: "Failed to generate quiz",
    });
  }
}
