import { readFile } from 'fs/promises';

import { FileMissingError } from '@app/core/errors/file-missing-error.js';
import { getters } from '@app/store/index.js';
import { PathsConfig } from '../../../config/paths.config.js';

let machineId: string | null = null;

export const getMachineId = async (): Promise<string> => {
    const paths = PathsConfig.getInstance();
    const path = paths.machineId;

    if (machineId) {
        return machineId;
    }

    if (!path) {
        const error = new FileMissingError('/etc/machine-id');
        error.fatal = false;

        throw error;
    }
    machineId = await readFile(path, 'utf8')
        .then((machineId) => machineId.split('\n')[0].trim())
        .catch(() => '');
    return machineId;
};
