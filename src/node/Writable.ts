import fs from 'fs/promises';
import { tmpFileSync } from '../utils.js';
import type { FileHandle } from 'fs/promises';
import type { IReadable, IWritable } from '../types.js';
import { Readable } from './Readable.js';

export class Writable implements IWritable {
	private _uint8Array: Uint8Array = new Uint8Array([]);
	private _filename: string | undefined;
	private _prepared = false;
	private _bytesWrote = 0;
	private _fp: FileHandle | null = null;

	constructor(params: { filename?: string } = {}) {
		if (params.filename) {
			this._filename = params.filename;
		}
	}

	size(): number {
		if (this._filename) {
			return this._bytesWrote;
		}
		return this._uint8Array.length;
	}

	async prepare(): Promise<void> {
		if (this._prepared) {
			return;
		}

		if (this._filename) {
			this._fp = await fs.open(this._filename, 'w');
		}

		this._prepared = true;
	}

	async close(): Promise<void> {
		if (this._fp) {
			try {
				await this._fp.close();
			} catch {
				// file may already be closed
			}
			this._fp = null;
			this._prepared = false;
		}
	}

	async saveToFile(filename: string): Promise<void> {
		await fs.writeFile(filename, this._uint8Array);
	}

	async write(append: Uint8Array | number[]): Promise<void> {
		if (!this._prepared) {
			await this.prepare();
		}

		const data = append instanceof Uint8Array ? append : Uint8Array.from(append);

		if (this._fp) {
			await this._fp.write(data, 0, data.length);
			this._bytesWrote += data.length;
		} else {
			const ret = new Uint8Array(this._uint8Array.length + data.length);
			ret.set(this._uint8Array, 0);
			ret.set(data, this._uint8Array.length);
			this._bytesWrote += data.length;
			this._uint8Array = ret;
		}
	}

	async toReadable(): Promise<IReadable> {
		if (this._filename) {
			await this.close();
			return new Readable({ filename: this._filename });
		} else {
			const tmpName = tmpFileSync();
			await this.saveToFile(tmpName);
			await this.close();
			return new Readable({ filename: tmpName });
		}
	}
}
