declare module "pdf-parse" {
  import { Buffer } from "buffer";

  interface PDFData {
    text: string;
    numpages: number;
    numrender: number;
    info: Record<string, unknown>;
    metadata: Record<string, unknown>;
    version: string;
  }

  export default function (pdfBuffer: Buffer): Promise<PDFData>;
}
