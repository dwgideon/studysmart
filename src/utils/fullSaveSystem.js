// StudySmart Full Save System (Supabase integration)

import { supabase } from "../utils/supabaseClient";
import { processStudyInput } from "../utils/aiOrchestration";

// This function will be called after file upload or topic creation
export async function handleStudyProcessing(userId, extractedText, topicTitle) {
  try {
    // 1️⃣ Call the AI orchestration layer
    const processedData = await processStudyInput(userId, extractedText, topicTitle);

    // 2️⃣ Save to Supabase
    const { error } = await supabase.from("topics").insert({
      user_id: processedData.user_id,
      title: processedData.title,
      image_url: processedData.image_url,
      flashcards: processedData.flashcards,
      quiz: processedData.quiz,
      summary: processedData.summary,
    });

    if (error) {
      console.error("Supabase insert error:", error);
      return false;
    }

    console.log("✅ Study data successfully saved!");
    return true;
  } catch (err) {
    console.error("Full save system error:", err);
    return false;
  }
}
