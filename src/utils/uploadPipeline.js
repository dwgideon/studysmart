// StudySmart Upload Pipeline Integration

import { handleStudyProcessing } from "../utils/fullSaveSystem";

// This function will be called after user uploads or extracts text
export async function processUploadedFile(userId, extractedText, topicTitle) {
  try {
    console.log("🚀 Starting full AI processing for uploaded notes...");
    
    const result = await handleStudyProcessing(userId, extractedText, topicTitle);

    if (result) {
      console.log("✅ Full AI processing and save completed successfully!");
    } else {
      console.error("⚠ Failed to save study data.");
    }
  } catch (err) {
    console.error("❌ Upload pipeline error:", err);
  }
}
