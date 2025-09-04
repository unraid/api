import { Injectable } from '@nestjs/common';
import { mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';

import type { Options, Result, ResultPromise } from 'execa';
import { execa, ExecaError } from 'execa';

import { fileExists } from '@app/core/utils/files/file-exists.js';
import { PATHS_LOGS_DIR, PM2_HOME, PM2_PATH } from '@app/environment.js';
import { LogService } from '@app/unraid-api/cli/log.service.js';

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
    /**
     * Executes a PM2 command with the specified context and arguments.
     * Handles logging automatically (stdout -> trace, stderr -> error), unless the `raw` flag is
     * set to true, in which case the caller must handle desired effects.
     *
     * @param context - Execa Options for command execution, such as a unique tag for logging
     *                  and whether the result should be handled raw.
     * @param args - The arguments to pass to the PM2 command.
     * @returns ResultPromise\<@param context\> When raw is true
     * @returns Promise\<Result\> When raw is false
     */
    run<T extends CmdContext>(context: T & { raw: true }, ...args: string[]): ResultPromise<T>;

    run(context: CmdContext & { raw?: false }, ...args: string[]): Promise<Result>;

    async run(context: CmdContext, ...args: string[]) {
        const { tag, raw, ...execOptions } = context;
        // Default to true to match execa's default behavior
        execOptions.extendEnv ??= true;
        execOptions.shell ??= 'bash';

        // Ensure /usr/local/bin is in PATH for Node.js
        const currentPath = execOptions.env?.PATH || process.env.PATH || '/usr/bin:/bin:/usr/sbin:/sbin';
        const needsPathUpdate = !currentPath.includes('/usr/local/bin');
        const finalPath = needsPathUpdate ? `/usr/local/bin:${currentPath}` : currentPath;

        // Only modify PATH if needed, regardless of extendEnv setting
        if (needsPathUpdate) {
            execOptions.env = {
                ...execOptions.env,
                PATH: finalPath,
            };
        }
        const runCommand = () => execa(PM2_PATH, [...args], execOptions satisfies Options);
        if (raw) {
            return runCommand();
        }
        return runCommand()
            .then((result) => {
                this.logger.trace(result.stdout);
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
     * This method removes the PM2 dump file located at `~/.pm2/dump.pm2` by default.
     * It logs a message indicating that the PM2 dump has been cleared.
     *
     * @returns A promise that resolves once the dump file is removed.
     */
    async deleteDump(dumpFile = join(PM2_HOME, 'dump.pm2')) {
        await rm(dumpFile, { force: true });
        this.logger.trace('PM2 dump cleared.');
    }

    async forceKillPm2Daemon() {
        try {
            // Find all PM2 daemon processes and kill them
            const pids = (await execa('pgrep', ['-i', 'PM2'])).stdout.split('\n').filter(Boolean);
            if (pids.length > 0) {
                await execa('kill', ['-9', ...pids]);
                this.logger.trace(`Killed PM2 daemon processes: ${pids.join(', ')}`);
            }
        } catch (err) {
            if (err instanceof ExecaError && err.exitCode === 1) {
                this.logger.trace('No PM2 daemon processes found.');
            } else {
                this.logger.error(`Error force killing PM2 daemon: ${err}`);
            }
        }
    }

    async deletePm2Home() {
        if ((await fileExists(PM2_HOME)) && (await fileExists(join(PM2_HOME, 'pm2.log')))) {
            await rm(PM2_HOME, { recursive: true, force: true });
            this.logger.trace('PM2 home directory cleared.');
        } else {
            this.logger.trace('PM2 home directory does not exist.');
        }
    }

    /**
     * Ensures that the dependencies necessary for PM2 to start and operate are present.
     */
    async ensurePm2Dependencies() {
        await mkdir(PATHS_LOGS_DIR, { recursive: true });
    }
}
