import { execa } from 'execa';
import { Command, CommandRunner, Option } from 'nest-commander';

import { ECOSYSTEM_PATH, PM2_PATH } from '@app/consts';
import { levels } from '@app/core/log';
import { LogService } from '@app/unraid-api/cli/log.service';

interface StartCommandOptions {
    debug?: boolean;
    port?: string;
    'log-level'?: string;
    environment?: string;
}

@Command({ name: 'start' })
export class StartCommand extends CommandRunner {
    constructor(private readonly logger: LogService) {
        super();
    }

    async run(_, options: StartCommandOptions): Promise<void> {
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
    })
    parseLogLevel(val: string): typeof levels {
        return (levels.includes(val as (typeof levels)[number])
            ? (val as (typeof levels)[number])
            : 'info') as unknown as typeof levels;
    }
}
