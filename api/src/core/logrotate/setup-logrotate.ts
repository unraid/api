import { writeFile } from 'fs/promises';
import { fileExists } from '@app/core/utils/files/file-exists';

export const setupLogRotation = async () => {
    if (await fileExists('/etc/logrotate.d/unraid-api')) {
        return;
    } else {
        await writeFile(
            '/etc/logrotate.d/unraid-api',
            `
            /var/log/unraid-api/*.log {
                rotate 2
                missingok
                size 5M
            }
        `,
            { mode: '644' }
        );
    }
};
