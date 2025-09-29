import { serve } from 'https://deno.land/std/http/server.ts'

serve(async (req) => {
  const { topic } = await req.json()

  const prompt = `Create 5 flashcards about "${topic}". Format as JSON like:
[
  { "question": "Q1", "answer": "A1" },
  { "question": "Q2", "answer": "A2" }
]`

  const completion = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${Deno.env.get("OPENAI_API_KEY")}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }]
    })
  });

  const data = await completion.json();
  const content = data.choices?.[0]?.message?.content;

  try {
    const flashcards = JSON.parse(content);
    return new Response(JSON.stringify(flashcards), { status: 200 });
  } catch {
    return new Response(JSON.stringify({ error: "Failed to parse flashcards" }), { status: 500 });
  }
});

