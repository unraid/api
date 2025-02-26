import { readFile } from 'fs/promises';
import { basename, join } from 'path';

import type { RootState } from '@app/store/index.js';
import { store } from '@app/store/index.js';

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
    return Buffer.from(keyFile, 'binary')
        .toString('base64')
        .trim()
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
};
