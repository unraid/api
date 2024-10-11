import { type RootState, store } from '@app/store';
import btoa from 'btoa';
import { basename, join } from 'node:path';
import { readFile } from 'node:fs/promises';

// Get key file
export const getKeyFile = async function (appStore: RootState = store.getState()) {
	const { emhttp, paths } = appStore;

	// If emhttp's state isn't loaded then return null as we can't load the key yet
	if (emhttp.var?.regFile === undefined) return null;

	// If the key location is empty return an empty string as there is no key
	if (emhttp.var?.regFile.trim() === '') return '';

	const keyFileName = basename(emhttp.var?.regFile);
	const registrationKeyFilePath = join(paths['keyfile-base'], keyFileName);
	const keyFile = await readFile(registrationKeyFilePath, 'binary');
	return btoa(keyFile).trim().replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
};
