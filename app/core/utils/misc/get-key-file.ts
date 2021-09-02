import btoa from 'btoa';
import { promises } from 'node:fs';
import { varState } from '../../states';

// Get key file
export const getKeyFile = async function (regFile: string = varState.data.regFile) {
	// Bail if key is missing
	if (regFile.trim() === '') {
		return '';
	}

	return promises.readFile(regFile, 'binary').then(keyFile => {
		return btoa(keyFile).trim().replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
	}).catch(() => '');
};
