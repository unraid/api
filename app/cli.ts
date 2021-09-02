import fs from 'node:fs';
import path from 'node:path';
import { spawn, exec } from 'node:child_process';
import { parse, ArgsParseOptions, ArgumentConfig } from 'ts-command-line-args';
import dotEnv from 'dotenv';
import findProcess from 'find-process';
import pidusage from 'pidusage';
import prettyMs from 'pretty-ms';
import dedent from 'dedent-tabs';
import { version } from '../package.json';
import { paths } from './core/paths';
import { logger } from './core/log';

const setEnvironment = (key: string, value: any) => {
	if (!value || String(value).trim().length === 0) {
		return;
	}

	process.env[key] = String(value);
};

interface Flags {
	command?: string;
	help?: boolean;
	debug?: boolean;
	port?: string;
	'log-level'?: string;
	'log-transport'?: string;
	environment?: string;
	version?: boolean;
}

const arguments_: ArgumentConfig<Flags> = {
	command: { type: String, defaultOption: true, optional: true },
	help: { type: Boolean, optional: true, alias: 'h', description: 'Prints this usage guide.' },
	debug: { type: Boolean, optional: true, alias: 'd', description: 'Enabled debug mode.' },
	port: { type: String, optional: true, alias: 'p', description: 'Set the graphql port.' },
	environment: { type: String, typeLabel: '{underline production/staging/development}', optional: true, description: 'Set the working environment.' },
	'log-level': {
		type: (level?: string) => {
			return ['error', 'warn', 'info', 'debug', 'trace', 'silly'].includes(level ?? '') ? level : undefined;
		}, typeLabel: '{underline error/warn/info/debug/trace/silly}', optional: true, description: 'Set the log level.'
	},
	'log-transport': {
		type: (transport?: string) => {
			return ['console', 'syslog'].includes(transport ?? 'console') ? transport : 'console';
		}, typeLabel: '{underline console/syslog}', optional: true, description: 'Set the log transport. (default=syslog)'
	},
	version: { type: Boolean, optional: true, alias: 'v', description: 'Show version.' }
};

const options: ArgsParseOptions<Flags> = {
	helpArg: 'help',
	optionSections: [{
		hide: ['command']
	}],
	baseCommand: 'unraid-api',
	headerContentSections: [{ header: 'Unraid API', content: 'Thanks for using the official Unraid API' }, {
		header: 'Usage:',
		content: '$ unraid-api {underline command} <options>'
	}, {
		header: 'Options:'
	}],
	footerContentSections: [{ header: '', content: 'Copyright © 2021 Lime Technology, Inc.' }]
};

const mainOptions = parse<Flags>(arguments_, { ...options, partial: true, stopAtFirstUnknown: true });
const commandOptions = (mainOptions as Flags & { _unknown: string[] })._unknown || [];
const command: string = (mainOptions as any).command;
// Use the env passed by the user, then the flag inline, then default to production
const getEnvironment = () => {
	// Ensure dot env is loaded
	dotEnv.config();
	return process.env.ENVIRONMENT ?? mainOptions.environment ?? 'production';
};

const getUnraidApiPid = async () => {
	// Find all processes called "unraid-api" which aren't this process
	const pids = await findProcess('name', 'unraid-api', true);
	return pids.find(_ => _.pid !== process.pid)?.pid;
};

const commands = {
	/**
	 * Start a new API process.
	 */
	async start() {
		// Load .env file
		dotEnv.config();

		// Set process title
		process.title = 'unraid-api';

		// Set cwd
		process.chdir(paths.get('unraid-api-base')!);

		// Set envs
		setEnvironment('DEBUG', mainOptions.debug);
		setEnvironment('ENVIRONMENT', getEnvironment());
		setEnvironment('LOG_LEVEL', mainOptions['log-level'] ?? (mainOptions.debug ? 'debug' : 'info'));
		setEnvironment('LOG_TRANSPORT', mainOptions['log-transport']);
		setEnvironment('PORT', mainOptions.port);

		console.info(`Starting unraid-api v${version}`);
		console.info(`Connecting to the "${getEnvironment()}" environment.`);

		// Load bundled index file
		const indexPath = './index.js';
		await import(indexPath);

		if (!mainOptions.debug) {
			if ('_DAEMONIZE_PROCESS' in process.env) {
				// In the child, clean up the tracking environment variable
				delete process.env._DAEMONIZE_PROCESS;
			} else {
				console.debug('Daemonizing process.');

				// Spawn child
				const child = spawn(process.execPath, process.argv.slice(2), {
					// In the parent set the tracking environment variable
					env: Object.assign(process.env, { _DAEMONIZE_PROCESS: '1' }),
					// The process MUST have it's cwd set to the
					// path where it resides within the Nexe VFS
					cwd: paths.get('unraid-api-base')!,
					stdio: 'ignore',
					detached: true
				});

				// Convert process into daemon
				child.unref();

				console.log('Daemonized successfully!');

				// Exit cleanly
				// eslint-disable-next-line unicorn/no-process-exit
				process.exit(0);
			}
		}
	},
	/**
	 * Stop a running API process.
	 */
	async stop() {
		// Find process called "unraid-api"
		const unraidApiPid = await getUnraidApiPid();

		// Bail if we have no process
		if (!unraidApiPid) {
			console.log('Found no running processes.');
			return;
		}

		console.info('Stopping unraid-api process...');
		process.kill(unraidApiPid, 'SIGTERM');
		console.info('Process stopped!');
	},
	/**
	 * Stop a running API process and then start it again.
	 */
	async restart() {
		await this.stop();
		await this.start();
	},
	/**
	 * Print API version.
	 */
	async version() {
		console.log(`Unraid API v${version}`);
	},
	async status() {
		// Find all processes called "unraid-api" which aren't this process
		const unraidApiPid = await getUnraidApiPid();
		if (!unraidApiPid) {
			console.log('Found no running processes.');
			return;
		}

		const stats = await pidusage(unraidApiPid);
		console.log(`API has been running for ${prettyMs(stats.elapsed)} and is in "${getEnvironment()}" mode!`);
	},
	async report() {
		// Find all processes called "unraid-api" which aren't this process
		const unraidApiPid = await getUnraidApiPid();
		const unraidVersion = fs.existsSync(paths.get('unraid-version')!) ? fs.readFileSync(paths.get('unraid-version')!, 'utf8').split('"')[1] : 'unknown';
		console.log(
			dedent`
				<-----UNRAID-API-REPORT----->
				Environment: ${getEnvironment()}
				Node API version: ${version} (${unraidApiPid ? 'running' : 'stopped'})
				Unraid version: ${unraidVersion}
				</----UNRAID-API-REPORT----->
			`
		);
	},
	async 'switch-env'() {
		const basePath = paths.get('unraid-api-base')!;
		const environmentFlashFilePath = paths.get('myservers-env')!;
		const environmentFile = await fs.promises.readFile(environmentFlashFilePath, 'utf-8').catch(() => '');

		logger.debug('Checking %s for current ENV, found %s', environmentFlashFilePath, environmentFile);

		// Match the env file env="production" which would be [0] = env="production", [1] = env and [2] = production
		const matchArray = /([A-Za-z]+)="*([A-Za-z]+)"*/.exec(environmentFile);
		// Get item from index 2 of the regex match or return undefined
		const [_, __, currentEnvironmentInFile] = matchArray && matchArray.length === 3 ? matchArray : [];

		const newEnvironment = currentEnvironmentInFile === 'production' ? 'staging' : 'production';
		if (currentEnvironmentInFile) {
			console.info('Switching from "%s" to "%s"...', currentEnvironmentInFile, newEnvironment);
		} else {
			console.info('No ENV found, setting env to "production"...');
		}

		// Write new env to flash
		const newEnvironmentLine = `env="${newEnvironment}"`;
		await fs.promises.writeFile(environmentFlashFilePath, newEnvironmentLine);
		logger.debug('Writing %s to %s', newEnvironmentLine, environmentFlashFilePath);

		// Copy the new env over to live location before restarting
		const source = path.join(basePath, `.env.${newEnvironment}`);
		const destination = path.join(basePath, '.env');
		logger.debug('Copying %s to %s', source, destination);
		await new Promise<void>((resolve, reject) => {
			// Use the native cp command to ensure we're outside the virtual file system
			exec(`cp "${source}" "${destination}"`, error => {
				if (error) {
					reject(error);
					return;
				}

				resolve();
			});
		});

		// If there's a process running restart it
		const unraidApiPid = await getUnraidApiPid();
		if (unraidApiPid) {
			console.info('unraid-api is running, restarting...');

			// Restart the process
			await this.restart();
			return;
		}

		console.info('Run "unraid-api start" to start the API.');
	}
};

async function main() {
	if (!command) {
		if (mainOptions.version) {
			await commands.version();
			// eslint-disable-next-line unicorn/no-process-exit
			process.exit();
		}

		// Run help command
		parse<Flags>(arguments_, { ...options, partial: true, stopAtFirstUnknown: true, argv: ['-h'] });
	}

	// Unknown command
	if (!Object.keys(commands).includes(command)) {
		throw new Error(`Invalid command "${command}"`);
	}

	// Run the command
	await commands[command]();
}

main().catch((error: unknown) => {
	console.error((error as Error).message);
});
