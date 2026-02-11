import type { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "Missing or invalid prompt" });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a helpful educational tutor." },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 700,
    });

    const plan = completion.choices[0]?.message?.content ?? "";

    return res.status(200).json({ plan });
  } catch (err) {
    console.error("Study plan AI error:", err);
    return res.status(500).json({ error: "Failed to generate study plan" });
  }
}
