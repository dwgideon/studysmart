import { postToGroq } from "./groqClient";

export async function generateOptions(term, correctDefinition) {
  const prompt = `
You're helping build a multiple choice study tool. The term is:

"${term}"

The correct definition is:
"${correctDefinition}"

Now provide 3 incorrect but realistic-sounding definitions that are related to the same topic but are clearly incorrect. Keep each wrong answer under 25 words.
Return them as a JSON array of strings only.
  `.trim();

  const response = await postToGroq(prompt);

  try {
  const match = response.match(/\[.*?\]/s);
  if (!match) throw new Error("No JSON array found in AI response");

  const parsed = JSON.parse(match[0]);
  if (Array.isArray(parsed) && parsed.length === 3) {
    return parsed;
  }

  throw new Error("Parsed result is not a 3-item array");
} catch (err) {
  console.error("Failed to parse AI response:", response);
  return [
    "Incorrect definition 1",
    "Incorrect definition 2",
    "Incorrect definition 3",
  ];
}}

