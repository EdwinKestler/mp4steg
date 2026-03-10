import jspack from './jspack.js';

export class Pack {
	static pack(format: string, values: unknown[]): number[] {
		return jspack.Pack(format, values);
	}

	static unpack(format: string, buffer: Uint8Array | number[]): number[] {
		return jspack.Unpack(format, buffer, 0);
	}
}
