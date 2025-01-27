import { execa } from 'execa';
import { Command, CommandRunner, Option } from 'nest-commander';

import { ECOSYSTEM_PATH, PM2_PATH } from '@app/consts';
import { LogService } from '@app/unraid-api/cli/log.service';

interface LogsOptions {
    lines: number;
}

@Command({ name: 'logs' })
export class LogsCommand extends CommandRunner {
    constructor(private readonly logger: LogService) {
        super();
    }

    @Option({ flags: '-l, --lines <lines>', description: 'Number of lines to tail', defaultValue: 100 })
    parseLines(input: string): number {
        const parsedValue = parseInt(input);
        return Number.isNaN(parsedValue) ? 100 : parsedValue;
    }

    async run(_: string[], options?: LogsOptions): Promise<void> {
        const lines = options?.lines ?? 100;
        const subprocess = execa(PM2_PATH, ['logs', ECOSYSTEM_PATH, '--lines', lines.toString()]);
        subprocess.stdout?.on('data', (data) => {
            this.logger.log(data.toString());
        });

        subprocess.stderr?.on('data', (data) => {
            this.logger.error(data.toString());
        });

        await subprocess;
    }
}
