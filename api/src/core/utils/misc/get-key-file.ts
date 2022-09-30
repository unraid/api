import { getters } from '@app/store';
import btoa from 'btoa';
import { readFile } from 'fs/promises';

// Get key file
export const getKeyFile = async function (path?: string) {
	const emhttp = getters.emhttp();
	const registrationKeyFilePath = (path ?? emhttp.var.regFile).trim();

	// Bail if key file path is empty
	if (registrationKeyFilePath === '') return '';

	const keyFile = await readFile(registrationKeyFilePath, 'binary');
	return btoa(keyFile).trim().replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
};
