import { execa } from 'execa';
import { Command, CommandRunner, Option } from 'nest-commander';

import { ECOSYSTEM_PATH, PM2_PATH } from '@app/consts';
import { LogService } from '@app/unraid-api/cli/log.service';

interface LogsOptions {
    lines: number
}

@Command({ name: 'logs' })
export class LogsCommand extends CommandRunner {
    constructor(private readonly logger: LogService) {
        super();
    }

    @Option({ flags: '-l, --lines', description: 'Number of lines to tail'})
    parseLines(input: string): number
    {
        return isNaN(parseInt(input)) ? 100 : parseInt(input)
    }

    async run(passedParams: string[], options?: LogsOptions): Promise<void> {
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
