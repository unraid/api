import { existsSync, renameSync, unlinkSync } from 'node:fs';

export const removeSso = () => {
    const path = '/usr/local/emhttp/plugins/dynamix/include/.login.php';
    const backupPath = path + '.bak';

    // Remove the SSO login inject file if it exists
    if (existsSync(path)) {
        unlinkSync(path);
    }

    // Move the backup file to the original location
    if (existsSync(backupPath)) {
        renameSync(backupPath, path);
    }

    console.log('Restored .login php file');
};
