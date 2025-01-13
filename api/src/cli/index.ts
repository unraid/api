import { execSync } from 'child_process';

import type { Flags } from '@app/cli/options';
import { args, mainOptions, options } from '@app/cli/options';
import { setEnv } from '@app/cli/set-env';
import { PM2_PATH } from '@app/consts';

const command = mainOptions.command as unknown as string;

export const main = async (...argv: string[]) => {
    if (mainOptions.debug) {
        const { cliLogger } = await import('@app/core/log');
        const { getters } = await import('@app/store');
        const ENVIRONMENT = await import('@app/environment');
        cliLogger.debug({ paths: getters.paths(), environment: ENVIRONMENT }, 'Starting CLI');
    }

    setEnv('PORT', process.env.PORT ?? mainOptions.port ?? '9000');

    if (!command) {
        // Run help command
        const { parse } = await import('ts-command-line-args');
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
        logs: async () => execSync(`${PM2_PATH} logs unraid-api --lines 200`, { stdio: 'inherit' }),
        'switch-env': import('@app/cli/commands/switch-env').then((pkg) => pkg.switchEnv),
        version: import('@app/cli/commands/version').then((pkg) => pkg.version),
        status: import('@app/cli/commands/status').then((pkg) => pkg.status),
        report: import('@app/cli/commands/report').then((pkg) => pkg.report),
        'validate-token': import('@app/cli/commands/validate-token').then((pkg) => pkg.validateToken),
    };

    // Unknown command
    if (!Object.keys(commands).includes(command)) {
        throw new Error(`Invalid command "${command}"`);
    }

    // Resolve the command import
    const commandMethod = await commands[command];

    // Run the command
    await commandMethod(...argv);

    process.exit(0);
};
