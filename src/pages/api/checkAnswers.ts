// pages/api/checkAnswers.ts
import { openai } from "@/lib/openai";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { questions, userAnswers } = req.body;

  const prompt = `
You are a quiz grader. Grade the following short answer questions.
For each question, compare the student answer (A1) to the correct answer (A2).
For each item, return a JSON object with:
- "correct": true/false
- "explanation": a short explanation if false

Example:
Q: What is the powerhouse of the cell?
A1: nucleus
A2: mitochondria

→
{ "correct": false, "explanation": "The correct answer is mitochondria. The nucleus is the control center, not the powerhouse." }

Now grade the following:

${questions.map((q: any, i: number) => 
  `Q: ${q.question}\nA1: ${userAnswers[i]}\nA2: ${q.answer}`).join("\n\n")}
`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });

    const raw = completion.choices[0].message?.content || "[]";
    const results = JSON.parse(raw);

    res.status(200).json({ results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to grade answers." });
  }
}
