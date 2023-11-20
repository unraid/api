import { report } from '@app/cli/commands/report';
import { getBannerPathIfPresent, getCasePathIfPresent } from '@app/core/utils/images/image-file-helpers';
import { getters } from '@app/store/index';
import { Injectable, Logger } from '@nestjs/common';
import { execa } from 'execa';
import { type ReadStream, createReadStream } from 'node:fs';
import { stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

@Injectable()
export class RestService {
    protected logger = new Logger(RestService.name);

    async saveApiReport (pathToReport: string) {
        try {
            const apiReport = await report('-vv', '--json');
            this.logger.debug('Report object %o', apiReport);
            await writeFile(
                pathToReport,
                JSON.stringify(apiReport, null, 2),
                'utf-8'
            );
        } catch (error) {
            this.logger.warn(
                'Could not generate report for zip with error %o',
                error
            );
        }
    }
    
    async getLogs(): Promise<ReadStream> {
        const logPath = getters.paths()['log-base'];
        try {
            await this.saveApiReport(join(logPath, 'report.json'));
        } catch (error) {
            this.logger.warn(
                'Could not generate report for zip with error %o',
                error
            );
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
