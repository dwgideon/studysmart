import mammoth from "mammoth";
import { generateOptions } from "./generateOptions";

async function extractTextFromFile(file) {
  const arrayBuffer = await file.arrayBuffer();
  const { value: rawText } = await mammoth.extractRawText({ arrayBuffer });
  return rawText;
}

export async function processFileWithAI(file) {
  const text = await extractTextFromFile(file);
  const lines = text.split(/\n|\r|\r\n/).filter((line) => line.trim().length > 0);

  const flashcards = [];

  for (const line of lines) {
    const [term, ...rest] = line.split("-");
    const question = term.trim();
    const answer = rest.join("-").trim() || "No definition provided";

    // ✅ Make sure we await this
    const wrongAnswers = await generateOptions(question, answer);

    flashcards.push({ question, answer, wrongAnswers });
  }

  return flashcards;
}

