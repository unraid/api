import { execa } from 'execa';
import { Command, CommandRunner, Option } from 'nest-commander';

import { ECOSYSTEM_PATH, PM2_PATH } from '@app/consts';
import { LogService } from '@app/unraid-api/cli/log.service';

import { PM2Service } from './pm2.service';

interface LogsOptions {
    lines: number;
}

@Command({ name: 'logs' })
export class LogsCommand extends CommandRunner {
    constructor(
        private readonly logger: LogService,
        private readonly pm2: PM2Service
    ) {
        super();
    }

    @Option({ flags: '-l, --lines <lines>', description: 'Number of lines to tail', defaultValue: 100 })
    parseLines(input: string): number {
        const parsedValue = parseInt(input);
        return Number.isNaN(parsedValue) ? 100 : parsedValue;
    }

    async run(_: string[], options?: LogsOptions): Promise<void> {
        const lines = options?.lines ?? 100;
        await this.pm2.run(
            { tag: 'PM2 Logs', raw: true },
            'logs',
            ECOSYSTEM_PATH,
            '--lines',
            lines.toString()
        );
    }
}
