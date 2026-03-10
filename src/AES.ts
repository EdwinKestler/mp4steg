import crypto from 'crypto';

const IV_BYTE_LENGTH = 12;
const SALT_BYTE_LENGTH = 16;
const AUTH_TAG_BYTE_LENGTH = 16;
const KEY_BYTE_LENGTH = 32; // AES-256
const PBKDF2_ITERATIONS = 600000;
const PBKDF2_DIGEST = 'sha512';

export interface AESParams {
	key?: Buffer | Uint8Array;
	password?: string;
	iv?: Buffer;
	salt?: Buffer;
	authTag?: Buffer;
}

export class AES {
	static readonly ivByteLength = IV_BYTE_LENGTH;
	static readonly saltByteLength = SALT_BYTE_LENGTH;
	static readonly authTagByteLength = AUTH_TAG_BYTE_LENGTH;

	private _key: Buffer;
	private _iv: Buffer;
	private _salt: Buffer | null;
	private _authTag: Buffer | null;
	private _cipher: crypto.CipherGCM | null = null;
	private _decipher: crypto.DecipherGCM | null = null;

	constructor(params: AESParams) {
		this._iv = params.iv || crypto.randomBytes(IV_BYTE_LENGTH);
		this._salt = params.salt || null;
		this._authTag = params.authTag || null;

		if (params.password) {
			if (!this._salt) {
				this._salt = crypto.randomBytes(SALT_BYTE_LENGTH);
			}
			this._key = AES.deriveKey(params.password, this._salt);
		} else if (params.key) {
			this._key = AES._normalizeKey(params.key);
		} else {
			throw new Error('Either key or password is required');
		}
	}

	private static _normalizeKey(key: Buffer | Uint8Array): Buffer {
		if (Buffer.isBuffer(key)) {
			if (key.length !== 16 && key.length !== 24 && key.length !== 32) {
				throw new Error('Key must be 16, 24, or 32 bytes. Got ' + key.length);
			}
			return key;
		}
		if (key instanceof Uint8Array) {
			if (key.length !== 16 && key.length !== 24 && key.length !== 32) {
				throw new Error('Key must be 16, 24, or 32 bytes. Got ' + key.length);
			}
			return Buffer.from(key);
		}
		throw new Error('Key must be a Buffer or Uint8Array');
	}

	private static _algorithmForKey(key: Buffer): string {
		switch (key.length) {
			case 16: return 'aes-128-gcm';
			case 24: return 'aes-192-gcm';
			case 32: return 'aes-256-gcm';
			default: throw new Error('Key must be 16, 24, or 32 bytes. Got ' + key.length);
		}
	}

	static deriveKey(password: string, salt: Buffer): Buffer {
		return crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, KEY_BYTE_LENGTH, PBKDF2_DIGEST);
	}

	encrypt(chunk: Buffer | null, finalize = false): Buffer {
		if (!this._cipher) {
			const algo = AES._algorithmForKey(this._key);
			this._cipher = crypto.createCipheriv(algo, this._key, this._iv) as crypto.CipherGCM;
		}

		if (finalize) {
			if (chunk && chunk.length > 0) {
				const processed = this._cipher.update(chunk);
				const final = this._cipher.final();
				this._authTag = this._cipher.getAuthTag();
				return Buffer.concat([processed, final]);
			} else {
				const final = this._cipher.final();
				this._authTag = this._cipher.getAuthTag();
				return final;
			}
		} else {
			return this._cipher.update(chunk!);
		}
	}

	decrypt(chunk: Buffer | null, finalize = false): Buffer {
		if (!this._decipher) {
			const algo = AES._algorithmForKey(this._key);
			this._decipher = crypto.createDecipheriv(algo, this._key, this._iv) as crypto.DecipherGCM;
			if (this._authTag) {
				this._decipher.setAuthTag(this._authTag);
			}
		}

		if (finalize) {
			if (chunk && chunk.length > 0) {
				const processed = this._decipher.update(chunk);
				const final = this._decipher.final();
				return Buffer.concat([processed, final]);
			} else {
				return this._decipher.final();
			}
		} else {
			return this._decipher.update(chunk!);
		}
	}

	getAuthTag(): Buffer {
		if (!this._authTag) {
			throw new Error('Auth tag not available. Call encrypt with finalize=true first');
		}
		return this._authTag;
	}

	getIV(): Buffer {
		return this._iv;
	}

	getSalt(): Buffer | null {
		return this._salt;
	}
}
