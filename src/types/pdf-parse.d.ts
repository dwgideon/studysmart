declare module "pdf-parse" {
  interface PDFInfo {
    numpages: number;
    numrender: number;
    info: Record<string, any>;
    metadata: any;
    version: string;
  }

  interface PDFData {
    text: string;
    info: PDFInfo;
  }

  function pdfParse(
    dataBuffer: Buffer | Uint8Array,
    options?: Record<string, any>
  ): Promise<PDFData>;

  export = pdfParse;
}
