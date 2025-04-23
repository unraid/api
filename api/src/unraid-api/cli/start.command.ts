import { Command, CommandRunner, Option } from 'nest-commander';

import type { LogLevel } from '@app/core/log.js';
import { ECOSYSTEM_PATH } from '@app/environment.js';
import { levels } from '@app/core/log.js';
import { LogService } from '@app/unraid-api/cli/log.service.js';
import { PM2Service } from '@app/unraid-api/cli/pm2.service.js';

interface StartCommandOptions {
    'log-level'?: string;
}

@Command({ name: 'start', description: 'Start the Unraid API' })
export class StartCommand extends CommandRunner {
    constructor(
        private readonly logger: LogService,
        private readonly pm2: PM2Service
    ) {
        super();
    }

    async cleanupPM2State() {
        await this.pm2.run({ tag: 'PM2 Stop' }, 'stop', ECOSYSTEM_PATH);
        await this.pm2.run({ tag: 'PM2 Update' }, 'update');
        await this.pm2.deleteDump();
        await this.pm2.run({ tag: 'PM2 Delete' }, 'delete', ECOSYSTEM_PATH);
    }

    async run(_: string[], options: StartCommandOptions): Promise<void> {
        this.logger.info('Starting the Unraid API');
        await this.cleanupPM2State();

        const env: Record<string, string> = {};
        if (options['log-level']) {
            env.LOG_LEVEL = options['log-level'];
        }

        const { stderr, stdout } = await this.pm2.run(
            { tag: 'PM2 Start', env, raw: true },
            'start',
            ECOSYSTEM_PATH,
            '--update-env'
        );
        if (stdout) {
            this.logger.log(stdout.toString());
        }
        if (stderr) {
            this.logger.error(stderr.toString());
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
