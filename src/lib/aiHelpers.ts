// src/lib/aiHelpers.ts
import { openai } from "./openai";

/**
 * Generate flashcards from a block of text.
 */
export async function generateFlashcardsFromText(text: string) {
  const prompt = `
You are a flashcard generator for students.

Instructions:
- Generate 5 concise flashcards from the provided content.
- Format the result as an array of JSON objects.
- Each object MUST have a "front" (question) and a "back" (answer).
- Do not include markdown, explanation, or extra formatting — ONLY return raw JSON.

Content:
"""
${text}
"""
Return JSON only.
`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
  });

  const raw = response.choices[0].message?.content || "[]";

  try {
    const cards = JSON.parse(raw);
    return Array.isArray(cards) ? cards : [];
  } catch {
    // fallback parsing
    return raw
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 5)
      .map((line) => ({ front: line, back: "..." }));
  }
}

/**
 * Generate quiz questions from a block of text.
 */
export async function generateQuizFromText(text: string) {
  const prompt = `
You are a quiz generator for students.

Instructions:
- Generate 5 multiple-choice questions from the content.
- Format each question as an object with:
  - "question": the question text
  - "options": an array of 4 answer options (strings)
  - "answer": the correct option (must match one of the options exactly)
- Return ONLY a JSON array of 5 objects.
- Do not include markdown, explanation, or extra formatting.

Content:
"""
${text}
"""
Return JSON only.
`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
  });

  const raw = response.choices[0].message?.content || "[]";

  try {
    const questions = JSON.parse(raw);
    return Array.isArray(questions) ? questions : [];
  } catch {
    return [];
  }
}

/**
 * Generate a short personalized study recommendation.
 */
export async function generateStudyRecommendation(topic: string | null) {
  const prompt = topic
    ? `The student last studied "${topic}". Suggest the next step to master this subject.`
    : `Provide a motivational study tip for a student.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
  });

  return response.choices[0].message?.content || "Keep going! You’re doing great!";
}
