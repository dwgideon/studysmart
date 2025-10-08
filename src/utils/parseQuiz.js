// utils/parseQuiz.js or parseFlashcards.ts
export function parseFlashcardsFromText(text) {
  const lines = text.split('\n').filter(Boolean);
  const cards = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^\d+\./.test(line)) {
      const question = line.replace(/^\d+\.\s*/, '').trim();
      const answerLine = lines[i + 1] || '';
      const answer = answerLine.includes('Answer:')
        ? answerLine.replace('Answer:', '').trim()
        : '...';
      cards.push({ question, answer });
    }
  }

  return cards;
}