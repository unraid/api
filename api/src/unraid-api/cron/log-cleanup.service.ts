import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { execa } from 'execa';

@Injectable()
export class LogCleanupService {
    private readonly logger = new Logger(LogCleanupService.name);

    @Cron('0 * * * *')
    async handleCron() {
        try {
            this.logger.debug('Running logrotate');
            await execa(`
                /usr/sbin/logrotate /etc/logrotate.conf \
                || { /usr/bin/logger -t logrotate "ALERT - exited abnormally." && false ; }`);
        } catch (error) {
            this.logger.error(error);
        }
    }
}
