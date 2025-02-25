import { Injectable, Logger } from '@nestjs/common';
import type { ReadStream } from 'node:fs';
import { createReadStream } from 'node:fs';
import { stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { execa } from 'execa';

import {
    getBannerPathIfPresent,
    getCasePathIfPresent,
} from '@app/core/utils/images/image-file-helpers.js';
import { getters } from '@app/store/index.js';
import { LogService } from '@app/unraid-api/cli/log.service.js';
import { ReportCommand } from '@app/unraid-api/cli/report.command.js';

@Injectable()
export class RestService {
    protected logger = new Logger(RestService.name);

    async saveApiReport(pathToReport: string) {
        try {
            const reportCommand = new ReportCommand(new LogService());

            const apiReport = await reportCommand.report();
            this.logger.debug('Report object %o', apiReport);
            await writeFile(pathToReport, JSON.stringify(apiReport, null, 2), 'utf-8');
        } catch (error) {
            this.logger.warn('Could not generate report for zip with error %o', error);
        }
    }

    async getLogs(): Promise<ReadStream> {
        const logPath = getters.paths()['log-base'];
        try {
            await this.saveApiReport(join(logPath, 'report.json'));
        } catch (error) {
            this.logger.warn('Could not generate report for zip with error %o', error);
        }
        const zipToWrite = join(logPath, '../unraid-api.tar.gz');

        const logPathExists = Boolean(await stat(logPath).catch(() => null));
        if (logPathExists) {
            try {
                await execa('tar', ['-czf', zipToWrite, logPath]);
                const tarFileExists = Boolean(await stat(zipToWrite).catch(() => null));

                if (tarFileExists) {
                    return createReadStream(zipToWrite);
                } else {
                    throw new Error('Failed to create log zip');
                }
            } catch (error) {
                throw new Error('Failed to create logs');
            }
        } else {
            throw new Error('No logs to download');
        }
    }

    async getCustomizationPath(type: 'banner' | 'case'): Promise<string | null> {
        switch (type) {
            case 'banner':
                return getBannerPathIfPresent();
            case 'case':
                return getCasePathIfPresent();
        }
    }

    async getCustomizationStream(type: 'banner' | 'case'): Promise<ReadStream> {
        const path = await this.getCustomizationPath(type);
        if (!path) {
            throw new Error(`No ${type} found`);
        }
        return createReadStream(path);
    }
}
