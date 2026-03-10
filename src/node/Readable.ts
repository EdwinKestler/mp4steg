import fs from 'fs/promises';
import type { FileHandle } from 'fs/promises';
import type { IReadable } from '../types.js';

export class Readable implements IReadable {
	private _filename: string | undefined;
	private _prepared = false;
	private _size = 0;
	private _fp: FileHandle | null = null;

	constructor(params: { filename?: string } = {}) {
		this._filename = params.filename;
	}

	isPrepared(): boolean {
		return this._prepared;
	}

	async prepare(): Promise<void> {
		if (this._prepared) {
			return;
		}

		if (this._filename) {
			this._fp = await fs.open(this._filename, 'r');
			const stats = await this._fp.stat();
			this._size = stats.size;
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
		}
		this._fp = null;
		this._prepared = false;
	}

	async getSlice(offset: number, length: number): Promise<Uint8Array> {
		if (!this._prepared) {
			await this.prepare();
		}

		const ret = new Uint8Array(length);
		await this._fp!.read(ret, 0, length, offset);
		return ret;
	}

	async size(): Promise<number> {
		if (!this._prepared) {
			await this.prepare();
		}
		return this._size;
	}
}
