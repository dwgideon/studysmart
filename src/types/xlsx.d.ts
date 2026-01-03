declare module "xlsx" {
  export function read(data: Buffer, options?: Record<string, unknown>): Workbook;
  export function utils(): Record<string, unknown>;
  export type Workbook = {
    SheetNames: string[];
    Sheets: Record<string, Sheet>;
  };
  export type Sheet = Record<string, unknown>;
}
