import { Injectable, Logger } from '@nestjs/common';

import { execa } from 'execa';

@Injectable()
export class AvahiService {
    private readonly logger = new Logger(AvahiService.name);

    async restart(): Promise<void> {
        await execa('/etc/rc.d/rc.avahidaemon', ['restart']);
        this.logger.log('Avahi daemon restarted');
    }
}
