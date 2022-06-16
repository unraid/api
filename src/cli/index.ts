import segfaultHandler from 'segfault-handler';
import { parse } from 'ts-command-line-args';
import dotEnv from 'dotenv';
import { cliLogger } from '../core/log';
import { start } from './commands/start';
import { stop } from './commands/stop';
import { Flags, mainOptions, options, args } from './options';
import { report } from './commands/report';
import { setEnv } from './set-env';
import { restart } from './commands/restart';
import { switchEnv } from './commands/switch-env';
import { version } from './commands/version';
import { status } from './commands/status';

const commands = {
	start,
	stop,
	restart,
	'switch-env': switchEnv,
	version,
	status,
	report
};

const command = mainOptions.command as unknown as string;

export const main = async (...argv: string[]) => {
	// Load .env file
	const envs = dotEnv.config({
		path: '/usr/local/bin/unraid-api/.env'
	});

	cliLogger.addContext('envs', envs);
	cliLogger.debug('Loading env file');
	cliLogger.removeContext('envs');

	// Set envs
	setEnv('LOG_TYPE', process.env.LOG_TYPE ?? (command === 'start' ? 'pretty' : 'raw'));

	cliLogger.debug('Starting CLI');

	setEnv('DEBUG', mainOptions.debug ?? false);
	setEnv('ENVIRONMENT', process.env.ENVIRONMENT ?? 'production');
	setEnv('PORT', process.env.PORT ?? mainOptions.port ?? '9000');
	setEnv('LOG_LEVEL', process.env.LOG_LEVEL ?? mainOptions['log-level'] ?? 'INFO');
	setEnv('LOG_TRANSPORT', process.env.LOG_TRANSPORT ?? 'out');

	if (!command) {
		// Run help command
		parse<Flags>(args, { ...options, partial: true, stopAtFirstUnknown: true, argv: ['-h'] });
	}

	// Unknown command
	if (!Object.keys(commands).includes(command)) {
		throw new Error(`Invalid command "${command}"`);
	}

	// Run the command
	await commands[command](...argv);

	// Only segfault in a specific mode
	if (process.env.PLEASE_SEGFAULT_FOR_ME) {
		// Wait 30s and then segfault
		setTimeout(() => {
			segfaultHandler.causeSegfault();
		}, 30_000);
	}
};
