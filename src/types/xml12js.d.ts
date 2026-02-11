declare module "xml2js" {
  export function parseStringPromise(
    str: string,
    opts?: any
  ): Promise<Record<string, any>>;
}
