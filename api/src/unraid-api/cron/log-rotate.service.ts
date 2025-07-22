import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { stat } from 'fs/promises';

import { execa } from 'execa';

@Injectable()
export class LogRotateService {
    private readonly logger = new Logger(LogRotateService.name);

    private readonly logFilePath = '/var/log/graphql-api.log';
    private readonly maxSizeBytes = 5 * 1024 * 1024; // 5MB

    @Cron('*/20 * * * *') // Every 20 minutes
    async handleCron() {
        try {
            const stats = await stat(this.logFilePath);
            if (stats.size > this.maxSizeBytes) {
                this.logger.debug(`Log file size (${stats.size} bytes) exceeds limit, truncating`);
                await execa('truncate', ['-s', '0', this.logFilePath]);
                this.logger.debug('Log file truncated successfully');
            } else {
                this.logger.debug(`Log file size (${stats.size} bytes) within limit`);
            }
        } catch (error) {
            if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
                this.logger.debug('Log file does not exist, skipping truncation');
            } else {
                this.logger.debug('Failed to check/truncate log file: ' + error);
            }
        }
    }
}
