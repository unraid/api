import { execa } from 'execa';

import { logger } from '@app/core/log.js';

export class NginxManager {
    public reloadNginx = async () => {
        try {
            await execa('/etc/rc.d/rc.nginx', ['reload']);
            return true;
        } catch (err: unknown) {
            logger.warn('Failed to restart Nginx with error: ', err);
            return false;
        }
    };
}
