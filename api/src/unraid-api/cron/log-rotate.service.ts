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
            if (!existsSync(this.logRotatePath)) {
                throw new Error(`Logrotate binary not found at ${this.logRotatePath}`);
            }
            if (!existsSync(this.configPath)) {
                throw new Error(`Logrotate config not found at ${this.configPath}`);
            }
            this.logger.debug('Running logrotate');
            const result = await execa(this.logRotatePath, [this.configPath]);
            if (result.failed) {
                throw new Error(`Logrotate execution failed: ${result.stderr}`);
            }
            this.logger.debug('Logrotate completed successfully');
        } catch (error) {
            this.logger.debug('Failed to run logrotate with error' + error);
        }
    }
}
