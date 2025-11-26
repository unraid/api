import { Command, CommandRunner, Option } from 'nest-commander';

import type { LogLevel } from '@app/core/log.js';
import type { LogLevelOptions } from '@app/unraid-api/cli/restart.command.js';
import { levels } from '@app/core/log.js';
import { LOG_LEVEL } from '@app/environment.js';
import { LogService } from '@app/unraid-api/cli/log.service.js';
import { NodemonService } from '@app/unraid-api/cli/nodemon.service.js';
import { parseLogLevelOption } from '@app/unraid-api/cli/restart.command.js';

@Command({ name: 'start', description: 'Start the Unraid API' })
export class StartCommand extends CommandRunner {
    constructor(
        private readonly logger: LogService,
        private readonly nodemon: NodemonService
    ) {
        super();
    }

    async run(_: string[], options: LogLevelOptions): Promise<void> {
        this.logger.info('Starting the Unraid API');
        await this.nodemon.start({ env: { LOG_LEVEL: options.logLevel?.toUpperCase() } });
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
