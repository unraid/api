import { readFile } from 'node:fs/promises';

import { fileExists } from '@app/core/utils/files/file-exists.js';
import { NODEMON_PID_PATH } from '@app/environment.js';

export const isUnraidApiRunning = async (): Promise<boolean> => {
    if (!(await fileExists(NODEMON_PID_PATH))) {
        return false;
    }

    const pidText = (await readFile(NODEMON_PID_PATH, 'utf-8')).trim();
    const pid = Number.parseInt(pidText, 10);
    if (Number.isNaN(pid)) {
        return false;
    }

    try {
        process.kill(pid, 0);
        return true;
    } catch {
        return false;
    }
};
