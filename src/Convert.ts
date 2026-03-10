import crypto from 'crypto';

export class Convert {
	static randomByteIn(maxOptions: number, option: number): number {
		const maxMultiple = Math.floor(256 / maxOptions);
		const randomValue = crypto.randomInt(maxMultiple);
		return randomValue * maxOptions + option;
	}

	static isByteIn(byte: number, maxOptions: number, option: number): boolean {
		return (byte % maxOptions === option);
	}

	static objectToBuffer(object: unknown): Buffer {
		return Buffer.from(JSON.stringify(object), 'utf-8');
	}

	static bufferToObject(buffer: Buffer | Uint8Array): unknown {
		return JSON.parse(Buffer.from(buffer).toString('utf-8'));
	}

	static hexStringToBuffer(str: string): Buffer {
		if (typeof str !== 'string' || !/^[0-9a-fA-F]*$/.test(str) || str.length % 2 !== 0) {
			throw new Error('Invalid hex string');
		}
		return Buffer.from(str, 'hex');
	}
}
