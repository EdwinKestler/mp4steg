import tmp from 'tmp';

export function tmpFileSync(): string {
	const tmpobj = tmp.fileSync();
	return tmpobj.name;
}
