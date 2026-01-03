import axios from "axios";

export async function postToGroq(prompt) {
  const apiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY;

  if (!apiKey) throw new Error("Missing Groq API key in .env.local");

  const endpoint = "https://api.groq.com/openai/v1/chat/completions";

  const requestBody = {
    model: "llama3-70b-8192",
    messages: [
      {
        role: "system",
        content: "You are a helpful educational assistant.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.7,
    max_tokens: 300,
  };

  try {
    const response = await axios.post(endpoint, requestBody, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
    });

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error("❌ Groq API Error:", error);
    throw error;
  }
}

