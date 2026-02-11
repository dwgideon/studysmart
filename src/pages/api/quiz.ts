import type { NextApiRequest, NextApiResponse } from "next";
import { openai } from "@/lib/openai";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const { lesson, grade = "middle" } = req.body;

    if (!lesson) {
      return res.status(400).json({ error: "Missing lesson text" });
    }

    const wordCount = lesson.split(/\s+/).length;

    // Dynamic scaling
    let questionCount = Math.round(wordCount / 80);

    // Boundaries
    if (questionCount < 5) questionCount = 5;
    if (questionCount > 40) questionCount = 40;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.4,
      max_tokens: 1500,

      messages: [
        {
          role: "system",
          content: `
Create a ${questionCount}-question multiple-choice quiz for a ${grade}-level student.

Rules:
- Generate EXACTLY ${questionCount} questions.
- Each question must contain:
  - "question"
  - "options" with keys A, B, C, D
  - "answer" with the correct letter
  - "explanation"

Respond ONLY with valid JSON:

{
  "questions": [
    {
      "question": "",
      "options": { "A": "", "B": "", "C": "", "D": "" },
      "answer": "",
      "explanation": ""
    }
  ]
}
`
        },
        {
          role: "user",
          content: lesson.slice(0, 12_000),
        }
      ]
    });

    const raw = completion.choices[0].message.content;

    let parsed;

    try {
      parsed = JSON.parse(raw ?? "{}");
    } catch {
      console.error("Quiz JSON parse failed:", raw);
      return res.status(500).json({
        error: "Quiz generation failed (invalid JSON)",
      });
    }

    return res.status(200).json(parsed);

  } catch (err) {
    console.error("Quiz API error:", err);
    return res.status(500).json({
      error: "AI quiz failed.",
    });
  }
}
