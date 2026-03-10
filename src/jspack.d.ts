interface JSPack {
  Pack(fmt: string, values: unknown[]): number[];
  Unpack(fmt: string, values: Uint8Array | number[], offset?: number): number[];
  CalcLength(fmt: string): number;
  PackTo(fmt: string, a: number[], p: number, values: unknown[], allowLessData?: boolean): number[] | false;
  UnpackTo(fmt: string, a: Uint8Array | number[], p: number, allowLessData?: boolean): number[] | undefined;
}

declare const jspack: JSPack;
export = jspack;
