import { readFileSync } from 'fs';

export const attemptReadFileSync = (path: string, fallback: any = undefined) => {
	try {
		return readFileSync(path, 'utf-8');
	} catch {
		return fallback;
	}
};
