import { Command, CommandRunner, Option } from 'nest-commander';

import type { LogLevel } from '@app/core/log.js';
import { levels } from '@app/core/log.js';
import { LOG_LEVEL } from '@app/environment.js';
import { LogService } from '@app/unraid-api/cli/log.service.js';
import { NodemonService } from '@app/unraid-api/cli/nodemon.service.js';

export interface LogLevelOptions {
    logLevel?: LogLevel;
}

export function parseLogLevelOption(val: string, allowedLevels: string[] = [...levels]): LogLevel {
    const normalized = val.toLowerCase() as LogLevel;
    if (allowedLevels.includes(normalized)) {
        return normalized;
    }
    throw new Error(`Invalid --log-level "${val}". Allowed: ${allowedLevels.join(', ')}`);
}

@Command({ name: 'restart', description: 'Restart the Unraid API' })
export class RestartCommand extends CommandRunner {
    constructor(
        private readonly logger: LogService,
        private readonly nodemon: NodemonService
    ) {
        super();
    }

    async run(_?: string[], options: LogLevelOptions = {}): Promise<void> {
        try {
            this.logger.info('Restarting the Unraid API...');
            const env = { LOG_LEVEL: options.logLevel?.toUpperCase() };
            await this.nodemon.restart({ env });
            this.logger.info('Unraid API restarted');
        } catch (error) {
            if (error instanceof Error) {
                this.logger.error(error.message);
            } else {
                this.logger.error('Unknown error occurred');
            }
            process.exit(1);
        }
    }

    @Option({
        flags: `--log-level <${levels.join('|')}>`,
        description: 'log level to use',
        defaultValue: LOG_LEVEL.toLowerCase(),
    })
    parseLogLevel(val: string): LogLevel {
        return parseLogLevelOption(val);
    }
}
