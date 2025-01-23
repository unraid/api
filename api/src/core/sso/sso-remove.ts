import { existsSync, renameSync, unlinkSync } from 'node:fs';

import { cliLogger } from '@app/core/log';

export const removeSso = () => {
    const path = '/usr/local/emhttp/plugins/dynamix/include/.login.php';
    const backupPath = path + '.bak';

    // Move the backup file to the original location
    if (existsSync(backupPath)) {
        // Remove the SSO login inject file if it exists
        if (existsSync(path)) {
            unlinkSync(path);
        }
        renameSync(backupPath, path);
        cliLogger.debug('SSO login file restored.');
    } else {
        cliLogger.debug('No SSO login file backup found.');
    }
};
