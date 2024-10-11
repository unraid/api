import { access } from 'node:fs/promises';
import { accessSync } from 'node:fs';
import { F_OK } from 'node:constants';

export const fileExists = async (path: string) => access(path, F_OK).then(() => true).catch(() => false);
export const fileExistsSync = (path: string) => {
	try {
		accessSync(path, F_OK);
		return true;
	} catch (error: unknown) {
		return false;
	}
};
