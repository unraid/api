import { execa } from 'execa';
import { Command, CommandRunner, Option } from 'nest-commander';

import { ECOSYSTEM_PATH, PM2_PATH } from '@app/consts';
import { levels, type LogLevel } from '@app/core/log';
import { LogService } from '@app/unraid-api/cli/log.service';

interface StartCommandOptions {
    'log-level'?: string;
}

@Command({ name: 'start' })
export class StartCommand extends CommandRunner {
    constructor(private readonly logger: LogService) {
        super();
    }

    async run(_: string[], options: StartCommandOptions): Promise<void> {
        this.logger.info('Starting the Unraid API');
        const envLog = options['log-level'] ? `LOG_LEVEL=${options['log-level']}` : '';
        const { stderr, stdout } = await execa(`${envLog} ${PM2_PATH}`.trim(), [
            'start',
            ECOSYSTEM_PATH,
            '--update-env',
        ]);
        if (stdout) {
            this.logger.log(stdout);
        }
        if (stderr) {
            this.logger.error(stderr);
            process.exit(1);
        }
        process.exit(0);
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
