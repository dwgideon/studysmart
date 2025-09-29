declare module "mammoth" {
  interface ExtractRawTextOptions {
    path?: string;
    buffer?: Buffer;
  }

  interface MammothResult {
    value: string; // extracted text
    messages: string[];
  }

  export function extractRawText(
    options: ExtractRawTextOptions
  ): Promise<MammothResult>;
}
