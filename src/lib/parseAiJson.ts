/** Extract JSON object/array from an LLM response that may include markdown fences. */
export function parseAiJson<T>(raw: string | null | undefined): T | null {
  if (!raw) {return null;}

  const trimmed = raw.trim();
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    const match = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match?.[1]) {
      try {
        return JSON.parse(match[1].trim()) as T;
      } catch {
        return null;
      }
    }
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(trimmed.slice(start, end + 1)) as T;
      } catch {
        return null;
      }
    }
    return null;
  }
}
