import { randomUUID } from 'crypto';
import type {
  Depth,
  Flashcard,
  QuizQuestion,
  StudyGuideSection,
  StudyMaterials,
} from './lib/types';

/**
 * Public entry point the rest of your app can import.
 * Accepts raw text and optional images (already OCR'd text) and returns structured study materials.
 */
export async function generateStudyMaterials(
  params: {
    topic: string;
    combinedText: string; // text from notes or OCR'ed images
    depth: Depth;
  }
): Promise<StudyMaterials> {
  // If you have a real LLM call, plug it in here
  // Example:
  //   const key = process.env.NEXT_PUBLIC_GROQ_API_KEY || process.env.OPENAI_API_KEY;
  //   if (key) return await callLLM(params);

  // For now, return a deterministic mock to keep dev free and unblocked.
  return mockGenerator(params);
}

/** 
 * Example: wire a real LLM here later.
 * Keep the return type strictly StudyMaterials so the rest of the app is fully typed.
 */
// async function callLLM({ topic, combinedText, depth }: { topic: string; combinedText: string; depth: Depth; }): Promise<StudyMaterials> {
//   // ...call Groq/OpenAI, parse JSON, validate, and return as StudyMaterials
// }

/** Deterministic local generator to develop UI without LLM cost */
function mockGenerator(
  { topic, combinedText, depth }: { topic: string; combinedText: string; depth: Depth; }
): StudyMaterials {
  const depthSize = depth === 'minimum' ? 6 : depth === 'medium' ? 12 : 20;

  const makeFlashcards = (n: number): Flashcard[] =>
    Array.from({ length: n }).map((_, i) => ({
      id: randomUUID(),
      question: `(${i + 1}) What is a key idea about "${topic}"?`,
      answer: `A concise explanation related to "${topic}".`,
    }));

  const letters = ['A', 'B', 'C', 'D'] as const;
  const makeQuiz = (n: number): QuizQuestion[] =>
    Array.from({ length: n }).map((_, i) => {
      const correctLabel = letters[i % 4];
      return {
        id: randomUUID(),
        prompt: `Which statement best describes concept #${i + 1} in "${topic}"?`,
        choices: letters.map((L) => ({
          label: L,
          text: `${L}) A possible statement about "${topic}".`,
        })),
        correctLabel,
        explanation: `The correct answer is ${correctLabel} because it aligns with the definition in your notes.`,
      };
    });

  const makeGuide = (): StudyGuideSection[] => ([
    { heading: `Core Concepts of ${topic}`, bullets: [
      `Definition and scope of ${topic}`,
      `Key terms used in ${topic}`,
      `High-level process overview`,
    ]},
    { heading: 'Applications', bullets: [
      'Real-world examples',
      'Common pitfalls',
      'Study tips and mnemonics',
    ]},
  ]);

  return {
    topic,
    flashcards: makeFlashcards(depthSize),
    quiz: makeQuiz(Math.max(4, Math.round(depthSize / 2))),
    summary: [
      `This is a ${depth} coverage generated from your notes (${combinedText.length} chars).`,
      `Use flashcards first, then quiz, then read the guide to fill gaps.`,
    ],
    guide: makeGuide(),
  };
}

