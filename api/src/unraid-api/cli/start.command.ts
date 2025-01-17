import { execSync } from 'child_process';
import { join } from 'path';

import { Command, CommandRunner, Option } from 'nest-commander';

import { PM2_PATH } from '@app/consts';
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
        this.logger.debug(options);
        this.logger.log(
            `Starting unraid-api with command: 
${PM2_PATH} start ${join(import.meta.dirname, 'ecosystem.config.json')} --update-env`
        );

        execSync(
            `${PM2_PATH} start ${join(import.meta.dirname, '../../', 'ecosystem.config.json')} --update-env`,
            {
                env: process.env,
                stdio: 'inherit',
                cwd: process.cwd(),
            }
        );
    }

    @Option({
        flags: '--log-level [string]',
        description: 'log level to use',
    })
    parseLogLevel(val: unknown): typeof levels {
        return (levels.includes(val as (typeof levels)[number])
            ? (val as (typeof levels)[number])
            : 'info') as unknown as typeof levels;
    }
}
