declare module "xlsx" {
  export interface WorkBook {
    SheetNames: string[];
    Sheets: { [sheet: string]: WorkSheet };
  }

  export interface WorkSheet {
    [cell: string]: any;
  }

  export function read(data: Buffer | Uint8Array, opts?: any): WorkBook;

  export const utils: {
    sheet_to_csv: (sheet: WorkSheet, opts?: any) => string;
  };
}
