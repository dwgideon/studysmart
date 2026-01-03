// StudySmart AI Orchestration Layer - MVP Version (No Leonardo)

import { postToGroq } from "../utils/groqClient";

// Entry point function
export async function processStudyInput(userId, extractedText, topicTitle, optionalImageUrl = null) {
  // Generate text content (flashcards, quizzes, summaries)
  const flashcards = await postToGroq(`Create 10 flashcards for "${topicTitle}". Format as Q: question? A: answer.`);
  const quiz = await postToGroq(`Create 5 multiple choice questions for "${topicTitle}" with 4 answer options.`);
  const summary = await postToGroq(`Write a short 3-paragraph study summary for "${topicTitle}".`);

  return {
    user_id: userId,
    title: topicTitle,
    image_url: optionalImageUrl,  // Use image only if user uploads it
    flashcards,
    quiz,
    summary
  };
}
