import { createHash } from "crypto";

export type SourceSegment = {
  text: string;
  page?: number | null;
  section?: string | null;
  startSeconds?: number | null;
  endSeconds?: number | null;
};

export type ChunkedSourcePart = {
  content: string;
  contentHash: string;
  locator: Record<string, string | number | null>;
  tokenEstimate: number;
};

export function splitSourceSegment(
  segment: SourceSegment,
  segmentIndex: number,
  maxChunks = 160
) {
  const chunks: ChunkedSourcePart[] = [];
  const text = segment.text;
  let start = 0;
  while (start < text.length && chunks.length < maxChunks) {
    let end = Math.min(text.length, start + 1_600);
    if (end < text.length) {
      const paragraph = text.lastIndexOf("\n\n", end);
      const sentence = text.lastIndexOf(". ", end);
      end = Math.max(
        start + 700,
        paragraph > start + 700
          ? paragraph
          : sentence > start + 700
            ? sentence + 1
            : end
      );
    }
    const content = text.slice(start, end).trim();
    if (content) {
      chunks.push({
        content,
        contentHash: createHash("sha256").update(content).digest("hex"),
        locator: {
          type: segment.startSeconds !== undefined ? "TRANSCRIPT" : segment.page ? "PAGE" : "TEXT",
          page: segment.page ?? null,
          section: segment.section ?? null,
          startSeconds: segment.startSeconds ?? null,
          endSeconds: segment.endSeconds ?? null,
          segment: segmentIndex + 1,
          characterStart: start,
          characterEnd: end,
        },
        tokenEstimate: Math.max(1, Math.ceil(content.length / 4)),
      });
    }
    if (end >= text.length) {break;}
    start = Math.max(start + 1, end - 180);
  }
  return chunks;
}
