import type { NextApiRequest, NextApiResponse } from "next";
import { openai } from "@/lib/openai";

// Markdown-first teaching style per level
const gradePrompts: Record<string, string> = {
  elementary: `
You are a friendly elementary school tutor (grades 3–5).

Rules:
- Always format answers in simple Markdown.
- Use short paragraphs.
- Use bullet points for steps.
- Use emojis only when helpful.
- No equations or technical notation.
- Explain like you're talking to a 9-year-old.
- Keep responses under 150 words.
`,

  middle: `
You are a middle school tutor (grades 6–8).

Rules:
- Use clean Markdown formatting.
- Break explanations into sections with bold headers.
- Use bullet lists.
- Keep paragraphs to 1–2 short sentences.
- Avoid raw equations or advanced chemical formulas.
- Explain step by step.
- Keep total length under 200 words.
`,

  high: `
You are a high school tutor (grades 9–12).

Rules:
- Use Markdown headings and bullet points.
- Mathematical formulas are allowed, but must be simple and readable.
- Avoid LaTeX formatting.
- Keep steps and explanations clean and concise.
`
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  try {
    const { messages, grade = "elementary" } = req.body;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.4,
      max_tokens: 500,
      messages: [
        {
          role: "system",
          content: gradePrompts[grade] || gradePrompts.elementary,
        },
        ...messages,
      ],
    });

    return res.status(200).json({
      reply: completion.choices[0].message.content,
    });
  } catch (err) {
    console.error("Tutor error:", err);
    return res.status(500).json({
      reply: "AI tutor failed to respond.",
    });
  }
}
