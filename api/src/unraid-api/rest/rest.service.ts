import { Injectable, Logger } from '@nestjs/common';
import type { ReadStream } from 'node:fs';
import { createReadStream } from 'node:fs';
import { stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import type { ExecaError } from 'execa';
import { execa } from 'execa';

import {
    getBannerPathIfPresent,
    getCasePathIfPresent,
} from '@app/core/utils/images/image-file-helpers.js';
import { getters } from '@app/store/index.js';
import { ApiReportService } from '@app/unraid-api/cli/api-report.service.js';

@Injectable()
export class RestService {
    protected logger = new Logger(RestService.name);

    constructor(private readonly apiReportService: ApiReportService) {}

    async saveApiReport(pathToReport: string) {
        try {
            const apiReport = await this.apiReportService.generateReport();
            this.logger.debug('Report object %o', apiReport);
            await writeFile(pathToReport, JSON.stringify(apiReport, null, 2), 'utf-8');
        } catch (error) {
            this.logger.warn('Could not generate report for zip with error %o', error);
        }
    }

    async getLogs(): Promise<ReadStream> {
        const logPath = getters.paths()['log-base'];
        const graphqlApiLog = '/var/log/graphql-api.log';

        try {
            await this.saveApiReport(join(logPath, 'report.json'));
        } catch (error) {
            this.logger.warn('Could not generate report for zip with error %o', error);
        }
        const zipToWrite = join(logPath, '../unraid-api.tar.gz');

        const logPathExists = Boolean(await stat(logPath).catch(() => null));
        if (logPathExists) {
            try {
                // Build tar command arguments
                const tarArgs = ['-czf', zipToWrite, logPath];

                // Check if graphql-api.log exists and add it to the archive
                const graphqlLogExists = Boolean(await stat(graphqlApiLog).catch(() => null));
                if (graphqlLogExists) {
                    tarArgs.push(graphqlApiLog);
                    this.logger.debug('Including graphql-api.log in archive');
                }

                // Execute tar with timeout and capture output
                await execa('tar', tarArgs, {
                    timeout: 60000, // 60 seconds timeout for tar operation
                    reject: true, // Throw on non-zero exit (default behavior)
                });

                const tarFileExists = Boolean(await stat(zipToWrite).catch(() => null));

                if (tarFileExists) {
                    return createReadStream(zipToWrite);
                } else {
                    throw new Error(
                        'Failed to create log zip - tar file not found after successful command'
                    );
                }
            } catch (error) {
                // Build detailed error message with execa's built-in error info
                let errorMessage = 'Failed to create logs archive';

                if (error && typeof error === 'object' && 'command' in error) {
                    const execaError = error as ExecaError;

                    if (execaError.timedOut) {
                        errorMessage = `Tar command timed out after 60 seconds. Command: ${execaError.command}`;
                    } else if (execaError.exitCode !== undefined) {
                        errorMessage = `Tar command failed with exit code ${execaError.exitCode}. Command: ${execaError.command}`;
                    }

                    // Add stderr/stdout if available
                    if (execaError.stderr) {
                        errorMessage += `. Stderr: ${execaError.stderr}`;
                    }
                    if (execaError.stdout) {
                        errorMessage += `. Stdout: ${execaError.stdout}`;
                    }

                    // Include the short message from execa
                    if (execaError.shortMessage) {
                        errorMessage += `. Details: ${execaError.shortMessage}`;
                    }
                } else if (error instanceof Error) {
                    errorMessage += `: ${error.message}`;
                }

                this.logger.error(errorMessage, error);
                throw new Error(errorMessage);
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
