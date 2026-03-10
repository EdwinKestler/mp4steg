import { describe, it, expect, afterAll } from 'vitest';
import path from 'path';
import fs from 'fs';
import { MP4 } from '../src/MP4.js';
import { Writable } from '../src/node/Writable.js';
import { Convert } from '../src/Convert.js';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

afterAll(() => {
	try { fs.unlinkSync(path.join(__dirname, 'test_with_meta.mp4')); } catch {}
});

describe('EmbedMeta', () => {
	it('embeds meta without encryption', async () => {
		const mp4 = new MP4();
		await mp4.loadFile({ filename: path.join(__dirname, 'test.mp4') });

		await mp4.embedFile({ filename: path.join(__dirname, 'test.txt'), meta: { testMeta: 'test' } });
		const wr = new Writable({ filename: path.join(__dirname, 'test_with_meta.mp4') });
		await mp4.embed(wr);
		await wr.close();

		const restoredMP4 = new MP4();
		await restoredMP4.loadFile({ filename: path.join(__dirname, 'test_with_meta.mp4') });

		expect(restoredMP4.getEmbedFiles()[0].meta!.testMeta).toBe('test');
	});

	it('embeds meta with key encryption', async () => {
		const key = Convert.hexStringToBuffer('000102030405060708090a0b0c0d0e0f');
		const mp4 = new MP4();
		mp4.setKey(key);
		await mp4.loadFile({ filename: path.join(__dirname, 'test.mp4') });

		await mp4.embedFile({ filename: path.join(__dirname, 'test.txt'), meta: { testMeta: 'test' } });
		const wr = new Writable({ filename: path.join(__dirname, 'test_with_meta.mp4') });
		await mp4.embed(wr);
		await wr.close();

		const restoredMP4 = new MP4();
		restoredMP4.setKey(key);
		await restoredMP4.loadFile({ filename: path.join(__dirname, 'test_with_meta.mp4') });

		expect(restoredMP4.getEmbedFiles()[0].meta!.testMeta).toBe('test');
	});
});
