import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

serve(async (req) => {
  try {
    const { text } = await req.json();

    const prompt = `
Generate 5 True or False questions based on the following study notes.
Respond as a JSON array like:
[
  { "statement": "The sun is a star.", "answer": true },
  { "statement": "Water freezes at 50°C.", "answer": false }
]

NOTES:
${text}
`;

    const apiKey = Deno.env.get("OPENAI_API_KEY");

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
  "Authorization": "Bearer " + apiKey,
  "Content-Type": "application/json",
},
      body: JSON.stringify({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      }),
    });

    const result = await response.json();
    const raw = result.choices?.[0]?.message?.content ?? "[]";
    const questions = JSON.parse(raw);

    return new Response(JSON.stringify({ questions }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("❌ Error generating questions:", err);
    return new Response(JSON.stringify({ error: "Failed to generate questions." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

