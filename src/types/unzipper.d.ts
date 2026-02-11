declare module "unzipper" {
  interface File {
    path: string;
    buffer: () => Promise<Buffer>;
  }

  interface Directory {
    files: File[];
  }

  export namespace Open {
    function file(path: string): Promise<Directory>;
  }
}
