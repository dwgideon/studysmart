// src/lib/openai.ts
import OpenAI from "openai";

export const isOpenAIConfigured = Boolean(process.env.OPENAI_API_KEY?.trim());

export const openai = new OpenAI({
  // Keep server modules loadable so API routes can return a useful 503 when a
  // deployment is missing configuration instead of crashing during import.
  apiKey: process.env.OPENAI_API_KEY?.trim() || "openai-key-not-configured",
});
