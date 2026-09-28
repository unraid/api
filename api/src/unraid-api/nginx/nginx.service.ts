import { Injectable, Logger } from '@nestjs/common';

import { execa } from 'execa';

let activeReload: Promise<boolean> | undefined;

@Injectable()
export class NginxService {
    private readonly logger = new Logger(NginxService.name);

    /** reloads nginx via its rc script */
    async reload(): Promise<boolean> {
        if (activeReload) {
            this.logger.debug('Nginx reload already in progress; waiting for it to complete');
            return activeReload;
        }

        const reload = this.executeReload();
        activeReload = reload;

        try {
            return await reload;
        } finally {
            activeReload = undefined;
        }
    }

    private async executeReload(): Promise<boolean> {
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
