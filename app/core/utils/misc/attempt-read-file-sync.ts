import { readFileSync } from 'node:fs';

export const attemptReadFileSync = (path: string, fallback?: any) => {
	try {
		return readFileSync(path, 'utf-8');
	} catch {
		return fallback;
	}
};
