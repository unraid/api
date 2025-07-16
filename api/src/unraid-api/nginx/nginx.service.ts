import { Injectable, Logger } from '@nestjs/common';

import { execa } from 'execa';

@Injectable()
export class NginxService {
    private readonly logger = new Logger(NginxService.name);

    /** reloads nginx via its rc script */
    async reload() {
        try {
            await execa('/etc/rc.d/rc.nginx', ['reload']);
            this.logger.log('Nginx reloaded');
            return true;
        } catch (err: unknown) {
            this.logger.warn('Failed to reload Nginx with error: ', err);
            return false;
        }
    }
}
