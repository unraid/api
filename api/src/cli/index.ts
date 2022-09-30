import { causeSegfault } from 'segfault-handler';
import { parse } from 'ts-command-line-args';
import { cliLogger } from '@app/core/log';
import { Flags, mainOptions, options, args } from '@app/cli/options';
import { setEnv } from '@app/cli/set-env';
import { env } from '@app/dotenv';
import { getters } from '@app/store';

const command = mainOptions.command as unknown as string;

export const main = async (...argv: string[]) => {
	cliLogger.addContext('envs', env);
	cliLogger.debug('Loading env file');
	cliLogger.removeContext('envs');

	// Set envs
	setEnv('LOG_TYPE', process.env.LOG_TYPE ?? (command === 'start' ? 'pretty' : 'raw'));
	cliLogger.addContext('paths', getters.paths());
	cliLogger.debug('Starting CLI');
	cliLogger.removeContext('paths');

	setEnv('DEBUG', mainOptions.debug ?? false);
	setEnv('ENVIRONMENT', process.env.ENVIRONMENT ?? 'production');
	setEnv('PORT', process.env.PORT ?? mainOptions.port ?? '9000');
	setEnv('LOG_LEVEL', process.env.LOG_LEVEL ?? mainOptions['log-level'] ?? 'INFO');
	setEnv('LOG_TRANSPORT', process.env.LOG_TRANSPORT ?? 'out');

	if (!command) {
		// Run help command
		parse<Flags>(args, { ...options, partial: true, stopAtFirstUnknown: true, argv: ['-h'] });
	}

	// Only import the command we need when we use it
	const commands = {
		start: import('@app/cli/commands/start').then(pkg => pkg.start),
		stop: import('@app/cli/commands/stop').then(pkg => pkg.stop),
		restart: import('@app/cli/commands/restart').then(pkg => pkg.restart),
		'switch-env': import('@app/cli/commands/switch-env').then(pkg => pkg.switchEnv),
		version: import('@app/cli/commands/version').then(pkg => pkg.version),
		status: import('@app/cli/commands/status').then(pkg => pkg.status),
		report: import('@app/cli/commands/report').then(pkg => pkg.report),
	};

	// Unknown command
	if (!Object.keys(commands).includes(command)) {
		throw new Error(`Invalid command "${command}"`);
	}

	// Resolve the command import
	const commandMethod = await commands[command];

	// Run the command
	await commandMethod(...argv);

	// Only segfault in a specific mode
	if (process.env.PLEASE_SEGFAULT_FOR_ME) {
		// Wait 30s and then segfault
		setTimeout(() => {
			causeSegfault();
		}, 30_000);
	}

	// Allow the process to exit
	// Don't exit when we start though
	if (!['start', 'restart'].includes(command)) {
		// Ensure process is exited
		process.exit(0);
	}
};
