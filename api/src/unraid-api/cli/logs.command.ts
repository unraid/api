import { Command, CommandRunner, Option } from 'nest-commander';

import { NodemonService } from '@app/unraid-api/cli/nodemon.service.js';

interface LogsOptions {
    lines: number;
}

@Command({ name: 'logs', description: 'View logs' })
export class LogsCommand extends CommandRunner {
    constructor(private readonly nodemon: NodemonService) {
        super();
    }

    @Option({ flags: '-l, --lines <lines>', description: 'Number of lines to tail', defaultValue: 100 })
    parseLines(input: string): number {
        const parsedValue = parseInt(input);
        return Number.isNaN(parsedValue) ? 100 : parsedValue;
    }

    async run(_: string[], options?: LogsOptions): Promise<void> {
        const lines = options?.lines ?? 100;
        await this.nodemon.logs(lines);
    }
}
