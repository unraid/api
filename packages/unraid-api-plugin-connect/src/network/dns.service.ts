import { Injectable, Logger } from '@nestjs/common';

import { execa } from 'execa';

@Injectable()
export class DnsService {
    private readonly logger = new Logger(DnsService.name);

    async update() {
        try {
            await execa('/usr/bin/php', ['/usr/local/emhttp/plugins/dynamix/include/UpdateDNS.php']);
            return true;
        } catch (err: unknown) {
            this.logger.warn('Failed to call Update DNS with error: ', err);
            return false;
        }
    }
}
