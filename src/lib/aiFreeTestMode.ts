export const isAiFreeTestMode = process.env.AI_FREE_TEST_MODE === "true";

export const AI_FREE_SAMPLE_LESSON = `Water Cycle Test Lesson
Evaporation happens when liquid water warms and changes into water vapor.
Condensation happens when water vapor cools and forms tiny liquid droplets.
Clouds form when many condensed water droplets gather in the atmosphere.
Precipitation is water that falls from clouds as rain, snow, sleet, or hail.
Collection happens when water gathers in oceans, lakes, rivers, and soil.
The Sun provides most of the energy that drives the water cycle.
Plants release water vapor through a process called transpiration.
The water cycle continually moves water through Earth's surface and atmosphere.`;

type LocalFlashcard = { front: string; back: string; concept: string };

function cleanLines(text: string) {
  return text
    .replace(/^\[[^\]]+\]\s*/gm, "")
    .split(/\n+|(?<=[.!?])\s+/)
    .map((line) => line.replace(/^[-*•]\s*/, "").trim())
    .filter((line) => line.length >= 18 && line.length <= 700);
}

function conceptFrom(sentence: string) {
  const named = sentence.match(/^([A-Z][A-Za-z -]{2,35})\s+(?:is|are|happens|occurs|means|provides|forms|releases)\b/);
  if (named?.[1]) {return named[1].trim();}
  const words = sentence.match(/[A-Za-z]{4,}/g) ?? [];
  return words.slice(0, 3).join(" ") || "Core ideas";
}

export function generateLocalFlashcards(text: string, count = 8): LocalFlashcard[] {
  const input = cleanLines(text);
  const fallback = cleanLines(AI_FREE_SAMPLE_LESSON);
  const facts = input.length >= 3 ? input : [...input, ...fallback];
  const uniqueFacts = [...new Set(facts)].slice(0, Math.max(3, Math.min(20, count)));
  return uniqueFacts.map((fact, index) => {
    const direct = fact.match(/^(.{3,90}?):\s+(.{3,})$/);
    if (direct) {return { front: direct[1].trim(), back: direct[2].trim(), concept: conceptFrom(direct[1]) };}
    const concept = conceptFrom(fact);
    return {
      front: index % 2 === 0 ? `What should you remember about ${concept}?` : `Explain this key idea: ${concept}.`,
      back: fact,
      concept,
    };
  });
}

type LocalQuizQuestion = {
  question: string;
  options: Record<"A" | "B" | "C" | "D", string>;
  answer: "A" | "B" | "C" | "D";
  explanation: string;
  concept: string;
};

export function generateLocalQuiz(text: string, count = 6): LocalQuizQuestion[] {
  const cards = generateLocalFlashcards(text, Math.max(6, count));
  const letters = ["A", "B", "C", "D"] as const;
  return cards.slice(0, Math.max(3, Math.min(20, count))).map((card, index) => {
    const correctLetter = letters[index % letters.length];
    const alternatives = cards
      .filter((candidate) => candidate.back !== card.back)
      .map((candidate) => candidate.back)
      .slice(0, 3);
    while (alternatives.length < 3) {alternatives.push("This idea is not supported by the study notes.");}
    const values = [...alternatives];
    values.splice(index % 4, 0, card.back);
    return {
      question: card.front,
      options: { A: values[0], B: values[1], C: values[2], D: values[3] },
      answer: correctLetter,
      explanation: `The study material states: ${card.back}`,
      concept: card.concept,
    };
  });
}

export function localGroundedTutorReply(input: {
  question: string;
  sourceMode: "materials" | "general";
  chunks: Array<{ label: string; content: string }>;
}) {
  if (input.sourceMode === "materials" && input.chunks.length > 0) {
    const chunk = input.chunks[0];
    const excerpt = cleanLines(chunk.content)[0] ?? chunk.content.slice(0, 360);
    return `Let’s use your study material. [${chunk.label}] ${excerpt}\n\nIn AI-free test mode, I can retrieve and cite your notes without generating new facts. Try explaining that idea in your own words, and I’ll help you check it.`;
  }
  if (input.sourceMode === "materials") {
    return "I don’t have study material to cite yet. Add the free sample lesson or upload notes, then ask again so we can test grounded tutoring.";
  }
  return `AI-free test mode received your question: “${input.question.slice(0, 180)}”\n\nGeneral-knowledge generation is intentionally disabled in this mode, so no paid AI request was made. Upload notes to test a grounded, cited tutor response for free.`;
}
