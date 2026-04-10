import { Injectable, Logger } from '@nestjs/common';

import { execa } from 'execa';

@Injectable()
export class AvahiService {
    private readonly logger = new Logger(AvahiService.name);

    async restart(): Promise<void> {
        try {
            await execa('/etc/rc.d/rc.avahidaemon', ['restart'], {
                timeout: 10_000,
            });
            this.logger.log('Avahi daemon restarted');
        } catch (error) {
            this.logger.error('Failed to restart Avahi daemon', error as Error);
            throw error;
        }
    }
}
