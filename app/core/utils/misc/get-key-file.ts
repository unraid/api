import btoa from 'btoa';
import { promises } from 'fs';
import { varState } from '../../states';

// Get key file
export const getKeyFile = async function () {
	// Bail if key is missing
	if (varState.data.regFile.trim() === '') {
		return '';
	}

	return promises.readFile(varState.data.regFile, 'binary').then(keyFile => {
		return btoa(keyFile).trim().replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
	}).catch(() => '');
};
