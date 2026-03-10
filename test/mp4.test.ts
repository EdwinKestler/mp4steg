import { describe, it, expect, afterAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import { MP4 } from '../src/MP4.js';
import { Convert } from '../src/Convert.js';
import { Writable } from '../src/node/Writable.js';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

afterAll(() => {
	for (const f of ['test_frommp4.txt', 'test_updated.mp4']) {
		try { fs.unlinkSync(path.join(__dirname, f)); } catch {}
	}
});

describe('MP4', () => {
	it('opens and parses mp4 file', async () => {
		const bf = fs.readFileSync(path.join(__dirname, 'test.mp4'));
		expect(bf).toBeInstanceOf(Buffer);

		const mp4 = new MP4();
		await mp4.loadFile({ filename: path.join(__dirname, 'test.mp4') });

		expect(mp4._atoms.length).toBeGreaterThan(0);
	});

	it('finds standard atoms', async () => {
		const mp4 = new MP4();
		await mp4.loadFile({ filename: path.join(__dirname, 'test.mp4') });

		expect(mp4.findAtoms(null, 'ftyp').length).toBeGreaterThan(0);
		expect(mp4.findAtoms(null, 'mdat').length).toBeGreaterThan(0);
		expect(mp4.findAtoms(null, 'moov').length).toBeGreaterThan(0);

		expect(mp4.findAtom('ftyp')).toBeTruthy();
		expect(mp4.findAtom('mdat')).toBeTruthy();
		expect(mp4.findAtom('moov')).toBeTruthy();
	});

	it('embeds and extracts data with key', async () => {
		const key = Convert.hexStringToBuffer('000102030405060708090a0b0c0d0e0f');

		const mp4 = new MP4();
		mp4.setKey(key);
		await mp4.loadFile({ filename: path.join(__dirname, 'test.mp4') });

		await mp4.embedFile({ filename: path.join(__dirname, 'test.txt') });
		const wr = new Writable({ filename: path.join(__dirname, 'test_updated.mp4') });
		await mp4.embed(wr);
		await wr.close();

		const originalSize = fs.statSync(path.join(__dirname, 'test.mp4')).size;
		const updatedSize = fs.statSync(path.join(__dirname, 'test_updated.mp4')).size;
		expect(updatedSize).toBeGreaterThan(originalSize);

		const restoredMP4 = new MP4();
		restoredMP4.setKey(key);
		await restoredMP4.loadFile({ filename: path.join(__dirname, 'test_updated.mp4') });

		expect(restoredMP4.getEmbedFiles()[0].isEncrypted).toBe(true);
		expect(restoredMP4.getEmbedFiles()[0].filename).toBe('test.txt');

		const extractedWritable = await restoredMP4.extractFile(0);
		await (extractedWritable as Writable).saveToFile(path.join(__dirname, 'test_frommp4.txt'));

		const originalData = fs.readFileSync(path.join(__dirname, 'test.txt'), 'utf-8');
		const restoredData = fs.readFileSync(path.join(__dirname, 'test_frommp4.txt'), 'utf-8');
		expect(restoredData).toBe(originalData);
	});
});
