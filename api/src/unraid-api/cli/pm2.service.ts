import { Injectable } from '@nestjs/common';

import type { Options, Result, ResultPromise } from 'execa';
import { execa } from 'execa';

import { PM2_PATH } from '@app/consts';
import { LogService } from '@app/unraid-api/cli/log.service';

type CmdContext = Options & {
    /** A tag for logging & debugging purposes. Should represent the operation being performed. */
    tag: string;
    /** Default: false.
     *
     * When true, results will not be automatically handled and logged.
     * The caller must handle desired effects, such as logging, error handling, etc.
     */
    raw?: boolean;
};

@Injectable()
export class PM2Service {
    constructor(private readonly logger: LogService) {}

    // Type Overload: if raw is true, return an execa ResultPromise (which is a Promise with extra properties)
    run<T extends CmdContext>(context: T & { raw: true }, ...args: string[]): ResultPromise<T>;

    // Type Overload: if raw is false, return a plain Promise<Result>
    run(context: CmdContext & { raw?: false }, ...args: string[]): Promise<Result>;

    /**
     * Executes a PM2 command with the provided arguments and environment variables.
     *
     * @param context - An object containing a tag for logging purposes and optional environment variables (merging with current env).
     * @param args - Arguments to pass to the PM2 command. Each arguement is escaped.
     * @returns A promise that resolves to a Result object containing the command's output.
     *          Logs debug information on success and error details on failure.
     */
    async run(context: CmdContext, ...args: string[]) {
        const { tag, raw, ...execOptions } = context;
        const runCommand = () => execa(PM2_PATH, [...args], execOptions satisfies Options);
        if (raw) {
            return runCommand();
        }
        return runCommand()
            .then((result) => {
                this.logger.debug(result.stdout);
                this.logger.log(`Operation "${tag}" completed.`);
                return result;
            })
            .catch((result: Result) => {
                this.logger.error(`PM2 error occurred from tag "${tag}": ${result.stdout}\n`);
                return result;
            });
    }

    /**
     * Deletes the PM2 dump file.
     *
     * This method removes the PM2 dump file located at `~/.pm2/dump.pm2`.
     * It logs a message indicating that the PM2 dump has been cleared.
     *
     * @returns A promise that resolves once the dump file is removed.
     */
    async deleteDump(dumpFile = '~/.pm2/dump.pm2') {
        // rm via bash instead of node to respect the home directory of the current user/session
        await execa('rm', ['-f', dumpFile], { stdio: 'inherit', shell: 'bash' });
        this.logger.log('PM2 dump cleared.');
    }
}
