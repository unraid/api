import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { execa } from 'execa';

@Injectable()
export class LogCleanupService {
    private readonly logger = new Logger(LogCleanupService.name);

    @Cron('* * * * *')
    async handleCron() {
        try {
            this.logger.debug('Running logrotate');
            await execa(`/usr/sbin/logrotate`, ['/etc/logrotate.conf']);
        } catch (error) {
            this.logger.error(error);
        }
    }
}
