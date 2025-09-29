import { uploadImageToStorage } from "../../utils/storageClient";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { topic } = req.body;
  if (!topic) {
    return res.status(400).json({ error: "Missing topic name" });
  }

  try {
    const imageUrl = await generateImageWithAI(topic);

    // Download image from URL and convert to blob
    const imageResp = await fetch(imageUrl);
    const arrayBuffer = await imageResp.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const storagePath = `topics/${Date.now()}-${topic.replace(/\s+/g, "_")}.png`;
    const publicUrl = await uploadImageToStorage(storagePath, buffer);

    if (!publicUrl) throw new Error("Failed to upload to storage");

    res.status(200).json({ imageUrl: publicUrl });
  } catch (error) {
    console.error("Error generating image:", error);
    res.status(500).json({ error: "Failed to generate image" });
  }
}

// Simple OpenAI DALL-E generation
async function generateImageWithAI(prompt) {
  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      prompt: `Create a study diagram or educational cover image about: ${prompt}`,
      n: 1,
      size: "512x512"
    })
  });

  if (!response.ok) throw new Error("OpenAI API failed");

  const result = await response.json();
  return result.data[0].url;
}
