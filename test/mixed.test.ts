import { describe, it, expect, afterAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import { MP4 } from '../src/MP4.js';
import { Writable } from '../src/node/Writable.js';
import { Convert } from '../src/Convert.js';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

afterAll(() => {
	for (const f of ['test_mixed.mp4', 'test_public.txt', 'test_encrypted.txt']) {
		try { fs.unlinkSync(path.join(__dirname, f)); } catch {}
	}
});

describe('Mixed encrypted and public files', () => {
	it('embeds two files, one public and one encrypted', async () => {
		const key = Convert.hexStringToBuffer('000102030405060708090a0b0c0d0e0f');
		const mp4 = new MP4();
		mp4.setKey(key);

		await mp4.loadFile({ filename: path.join(__dirname, 'test.mp4') });

		await mp4.embedFile({ filename: path.join(__dirname, 'test.txt'), meta: { testMeta: 'test' }, password: null });
		await mp4.embedFile({ filename: path.join(__dirname, 'test.txt'), meta: { testMeta: 'test2' } });

		const wr = new Writable({ filename: path.join(__dirname, 'test_mixed.mp4') });
		await mp4.embed(wr);
		await wr.close();

		const restoredMP4 = new MP4();
		restoredMP4.setKey(key);
		await restoredMP4.loadFile({ filename: path.join(__dirname, 'test_mixed.mp4') });

		expect(restoredMP4.getEmbedFiles()[0].isEncrypted).toBe(false);
		expect(restoredMP4.getEmbedFiles()[0].filename).toBe('test.txt');
		expect(restoredMP4.getEmbedFiles()[1].isEncrypted).toBe(true);
		expect(restoredMP4.getEmbedFiles()[1].filename).toBe('test.txt');

		const extractedWritable1 = await restoredMP4.extractFile(0);
		await (extractedWritable1 as Writable).saveToFile(path.join(__dirname, 'test_public.txt'));

		const extractedWritable2 = await restoredMP4.extractFile(1);
		await (extractedWritable2 as Writable).saveToFile(path.join(__dirname, 'test_encrypted.txt'));

		const originalData = fs.readFileSync(path.join(__dirname, 'test.txt'), 'utf-8');
		const restoredData1 = fs.readFileSync(path.join(__dirname, 'test_public.txt'), 'utf-8');
		const restoredData2 = fs.readFileSync(path.join(__dirname, 'test_encrypted.txt'), 'utf-8');

		expect(restoredData1).toBe(originalData);
		expect(restoredData2).toBe(originalData);
	});
});
