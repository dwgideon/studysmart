declare module "tesseract.js" {
  export interface TesseractOptions {
    lang?: string;
    tessedit_char_whitelist?: string;
  }

  export interface RecognizeResult {
    data: {
      text: string;
      confidence: number;
      words: Array<{
        text: string;
        confidence: number;
      }>;
    };
  }

  export function recognize(
    image: string | Buffer,
    lang?: string,
    options?: TesseractOptions
  ): Promise<RecognizeResult>;
}
