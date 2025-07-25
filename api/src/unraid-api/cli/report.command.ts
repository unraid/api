import { Command, CommandRunner, Option } from 'nest-commander';

import { ApiReportService } from '@app/unraid-api/cli/api-report.service.js';
import { LogService } from '@app/unraid-api/cli/log.service.js';

@Command({ name: 'report' })
export class ReportCommand extends CommandRunner {
    constructor(
        private readonly logger: LogService,
        private readonly apiReportService: ApiReportService
    ) {
        super();
    }

    @Option({
        flags: '-r, --raw',
        description: 'whether to enable raw command output',
        defaultValue: false,
    })
    parseRaw(): boolean {
        return true;
    }

    @Option({
        flags: '-j, --json',
        description: 'Display JSON output for this command',
        defaultValue: false,
    })
    parseJson(): boolean {
        return true;
    }

    async report(): Promise<string | void> {
        try {
            // Check if API is running
            const { isUnraidApiRunning } = await import('@app/core/utils/pm2/unraid-api-running.js');
            const apiRunning = await isUnraidApiRunning().catch((err) => {
                this.logger.debug('failed to get PM2 state with error: ' + err);
                return false;
            });

            if (!apiRunning) {
                this.logger.warn(
                    JSON.stringify(
                        {
                            error: 'API is not running. Please start the API server before running a report.',
                            apiRunning: false,
                        },
                        null,
                        2
                    )
                );
                return;
            }

            const report = await this.apiReportService.generateReport(apiRunning);

            this.logger.clear();
            this.logger.info(JSON.stringify(report, null, 2));
        } catch (error) {
            this.logger.debug('Error generating report via GraphQL: ' + error);
            this.logger.warn(
                JSON.stringify(
                    {
                        error: 'Failed to generate system report. Please ensure the API is running and properly configured.',
                        details: error instanceof Error ? error.message : String(error),
                    },
                    null,
                    2
                )
            );
        }
    }

    async run(): Promise<void> {
        await this.report();
    }
}
