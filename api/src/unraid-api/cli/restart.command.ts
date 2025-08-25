import { Command, CommandRunner, Option } from 'nest-commander';

import type { LogLevel } from '@app/core/log.js';
import { levels } from '@app/core/log.js';
import { ECOSYSTEM_PATH } from '@app/environment.js';
import { LogService } from '@app/unraid-api/cli/log.service.js';
import { PM2Service } from '@app/unraid-api/cli/pm2.service.js';

interface RestartCommandOptions {
    'log-level'?: string;
}

@Command({ name: 'restart', description: 'Restart the Unraid API' })
export class RestartCommand extends CommandRunner {
    constructor(
        private readonly logger: LogService,
        private readonly pm2: PM2Service
    ) {
        super();
    }

    async run(_?: string[], options: RestartCommandOptions = {}): Promise<void> {
        try {
            this.logger.info('Restarting the Unraid API...');
            const { stderr, stdout } = await this.pm2.run(
                { tag: 'PM2 Restart', raw: true, env: { LOG_LEVEL: options['log-level'] } },
                'restart',
                ECOSYSTEM_PATH,
                '--update-env'
            );

            if (stderr) {
                this.logger.error(stderr.toString());
                process.exit(1);
            } else if (stdout) {
                this.logger.info(stdout.toString());
            } else {
                this.logger.info('Unraid API restarted');
            }
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
        defaultValue: 'info',
    })
    parseLogLevel(val: string): LogLevel {
        return levels.includes(val as LogLevel) ? (val as LogLevel) : 'info';
    }
}
