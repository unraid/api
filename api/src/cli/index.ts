import { parse } from 'ts-command-line-args';
import { cliLogger } from '@app/core/log';
import { type Flags, mainOptions, options, args } from '@app/cli/options';
import { setEnv } from '@app/cli/set-env';
import { env } from '@app/dotenv';
import { getters } from '@app/store';

const command = mainOptions.command as unknown as string;

export const main = async (...argv: string[]) => {
    cliLogger.debug(env, 'Loading env file');

    // Set envs
    setEnv('LOG_TYPE', 'pretty');
    cliLogger.debug({ paths: getters.paths() }, 'Starting CLI');

    setEnv('DEBUG', mainOptions.debug ?? false);
    setEnv('ENVIRONMENT', process.env.ENVIRONMENT ?? 'production');
    setEnv('PORT', process.env.PORT ?? mainOptions.port ?? '9000');
    setEnv(
        'LOG_LEVEL',
        process.env.LOG_LEVEL ?? mainOptions['log-level'] ?? 'INFO'
    );
    if (!process.env.LOG_TRANSPORT) {
        if (process.env.ENVIRONMENT === 'production' && !mainOptions.debug) {
            setEnv('LOG_TRANSPORT', 'file');
            setEnv('LOG_LEVEL', 'DEBUG');
        } else if (!mainOptions.debug) {
            // Staging Environment, backgrounded plugin
            setEnv('LOG_TRANSPORT', 'file');
            setEnv('LOG_LEVEL', 'TRACE');
        } else {
            cliLogger.debug('In Debug Mode - Log Level Defaulting to: stdout');
        }
    }

    if (!command) {
        // Run help command
        parse<Flags>(args, {
            ...options,
            partial: true,
            stopAtFirstUnknown: true,
            argv: ['-h'],
        });
    }

    // Only import the command we need when we use it
    const commands = {
        start: import('@app/cli/commands/start').then((pkg) => pkg.start),
        stop: import('@app/cli/commands/stop').then((pkg) => pkg.stop),
        restart: import('@app/cli/commands/restart').then((pkg) => pkg.restart),
        'switch-env': import('@app/cli/commands/switch-env').then(
            (pkg) => pkg.switchEnv
        ),
        version: import('@app/cli/commands/version').then((pkg) => pkg.version),
        status: import('@app/cli/commands/status').then((pkg) => pkg.status),
        report: import('@app/cli/commands/report').then((pkg) => pkg.report),
        'validate-token': import('@app/cli/commands/validate-token').then(
            (pkg) => pkg.validateToken
        ),
    };

    // Unknown command
    if (!Object.keys(commands).includes(command)) {
        throw new Error(`Invalid command "${command}"`);
    }

    // Resolve the command import
    const commandMethod = await commands[command];

    // Run the command
    await commandMethod(...argv);

    // Allow the process to exit
    // Don't exit when we start though
    if (!['start', 'restart'].includes(command)) {
        // Ensure process is exited
        process.exit(0);
    }
};
