import { Injectable } from '@nestjs/common';

import type { Options, Result } from 'execa';
import { execa } from 'execa';

import { LogService } from '@app/unraid-api/cli/log.service';

type CmdContext = {
    tag: string;
    env?: Record<string, string>;
    /** Default: false.
     *
     * When true, results will not be automatically handled and logged.
     * The caller must handle desired effects.
     */
    raw?: boolean;
};

@Injectable()
export class PM2Service {
    constructor(private readonly logger: LogService) {}

    /**
     * Executes a PM2 command with the provided arguments and environment variables.
     *
     * @param context - An object containing a tag for logging purposes and optional environment variables (merging with current env).
     * @param args - Arguments to pass to the PM2 command. Each arguement is escaped.
     * @returns A promise that resolves to a Result object containing the command's output.
     *          Logs debug information on success and error details on failure.
     */
    async run(context: CmdContext, ...args: string[]) {
        const { tag, env, raw = false } = context;
        const runCommand = () => execa('bun', ['x', 'pm2', ...args], { env } satisfies Options);
        if (raw) {
            return runCommand();
        }
        return runCommand()
            .then((result) => {
                this.logger.debug(result.stdout);
                return result;
            })
            .catch((result: Result) => {
                this.logger.error(`PM2 error occurred from tag "${tag}": ${result.stdout}\n`);
                return result;
            });
    }
}
