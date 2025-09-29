// StudySmart AI Image Generator (Safe Prompts Version)

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.error("Please set your OPENAI_API_KEY in environment variables.");
  process.exit(1);
}

const topics = [
  { file: "ww2.jpg", prompt: "Educational diagram of major global events during the 1940s, suitable for classrooms." },
  { file: "water-cycle.jpg", prompt: "Simple colorful diagram of the water cycle with clouds, rain, evaporation and groundwater for students." },
  { file: "states.jpg", prompt: "Map of the United States showing state names and capitals for elementary students." },
  { file: "fractions.jpg", prompt: "Visual learning illustration of fractions for young students, using pie charts and bar models." },
  { file: "quadratic.jpg", prompt: "Colorful chart explaining quadratic equations with parabolas and key formulas for high school math." },
  { file: "cell.jpg", prompt: "Biology classroom diagram of cell division, mitosis phases illustrated clearly." },
  { file: "coldwar.jpg", prompt: "Simplified educational infographic of global relations during the Cold War period." },
  { file: "calculus.jpg", prompt: "Educational diagram introducing differential calculus with graphs and slope illustrations." },
  { file: "protein.jpg", prompt: "Biology diagram of protein synthesis process for students, including transcription and translation steps." },
];

const imageDir = path.join(process.cwd(), 'public', 'images');
if (!fs.existsSync(imageDir)) {
  fs.mkdirSync(imageDir, { recursive: true });
}

async function generateImage(topic) {
  console.log(`Generating: ${topic.file}`);

  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      prompt: topic.prompt,
      n: 1,
      size: "1024x1024",
      model: "dall-e-3",
    }),
  });

  if (!response.ok) {
    console.error(await response.text());
    throw new Error("OpenAI API call failed");
  }

  const result = await response.json();
  const imageUrl = result.data[0].url;

  const imgRes = await fetch(imageUrl);
  const imgBuffer = await imgRes.arrayBuffer();
  const filePath = path.join(imageDir, topic.file);
  fs.writeFileSync(filePath, Buffer.from(imgBuffer));

  console.log(`Saved: ${topic.file}`);
}

async function main() {
  for (const topic of topics) {
    try {
      await generateImage(topic);
    } catch (err) {
      console.error("Error generating", topic.file, err);
    }
  }
}

main();