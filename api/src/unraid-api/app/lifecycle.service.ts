import { Injectable, Logger } from '@nestjs/common';

import { execa } from 'execa';

@Injectable()
export class LifecycleService {
    private readonly logger = new Logger(LifecycleService.name);

    restartApi({ delayMs = 300 }: { delayMs?: number } = {}) {
        return setTimeout(async () => {
            this.logger.log('Restarting API');
            try {
                await execa('unraid-api', ['restart'], { shell: 'bash', stdio: 'ignore' });
            } catch (error) {
                this.logger.error(error);
            }
        }, delayMs);
    }
}
