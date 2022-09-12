import btoa from 'btoa';
import { readFile } from 'fs/promises';
import { varState } from '@app/core/states/var';

// Get key file
export const getKeyFile = async function (regFile: string = varState.data.regFile) {
	// Bail if key is missing
	if (regFile.trim() === '') {
		return '';
	}

	const keyFile = await readFile(regFile, 'binary');
	return btoa(keyFile).trim().replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
};
