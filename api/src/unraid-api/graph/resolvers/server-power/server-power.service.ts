import { Injectable, Logger } from '@nestjs/common';

import { execa } from 'execa';

@Injectable()
export class ServerPowerService {
    private readonly logger = new Logger(ServerPowerService.name);

    async reboot(): Promise<boolean> {
        this.logger.log('Server reboot requested via GraphQL');
        await execa('/sbin/reboot', ['-n']);
        return true;
    }

    async shutdown(): Promise<boolean> {
        this.logger.log('Server shutdown requested via GraphQL');
        await execa('/sbin/poweroff', ['-n']);
        return true;
    }
}
