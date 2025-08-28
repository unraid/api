import { Command, CommandRunner, Option } from 'nest-commander';

import type { LogLevel } from '@app/core/log.js';
import type { LogLevelOptions } from '@app/unraid-api/cli/restart.command.js';
import { levels } from '@app/core/log.js';
import { ECOSYSTEM_PATH, LOG_LEVEL } from '@app/environment.js';
import { LogService } from '@app/unraid-api/cli/log.service.js';
import { PM2Service } from '@app/unraid-api/cli/pm2.service.js';
import { parseLogLevelOption } from '@app/unraid-api/cli/restart.command.js';

@Command({ name: 'start', description: 'Start the Unraid API' })
export class StartCommand extends CommandRunner {
    constructor(
        private readonly logger: LogService,
        private readonly pm2: PM2Service
    ) {
        super();
    }

    async cleanupPM2State() {
        await this.pm2.ensurePm2Dependencies();
        await this.pm2.run({ tag: 'PM2 Stop' }, 'stop', ECOSYSTEM_PATH);
        await this.pm2.run({ tag: 'PM2 Update' }, 'update');
        await this.pm2.deleteDump();
        await this.pm2.run({ tag: 'PM2 Delete' }, 'delete', ECOSYSTEM_PATH);
    }

    async run(_: string[], options: LogLevelOptions): Promise<void> {
        this.logger.info('Starting the Unraid API');
        await this.cleanupPM2State();
        const env = { LOG_LEVEL: options.logLevel };
        const { stderr, stdout } = await this.pm2.run(
            { tag: 'PM2 Start', raw: true, extendEnv: true, env },
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
        defaultValue: LOG_LEVEL.toLowerCase(),
    })
    parseLogLevel(val: string): LogLevel {
        return parseLogLevelOption(val);
    }
}
