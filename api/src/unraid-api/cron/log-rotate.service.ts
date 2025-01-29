import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { existsSync } from 'fs';

import { execa } from 'execa';

@Injectable()
export class LogRotateService {
    private readonly logger = new Logger(LogRotateService.name);

    logRotatePath: string = '/usr/sbin/logrotate';
    configPath: string = '/etc/logrotate.conf';
    @Cron('0 * * * *')
    async handleCron() {
        try {
            if (existsSync(this.logRotatePath)) {
                this.logger.debug('Running logrotate');
                await execa(`/usr/sbin/logrotate`, ['/etc/logrotate.conf']);
            }
        } catch (error) {
            this.logger.error(error);
        }
    }
}
