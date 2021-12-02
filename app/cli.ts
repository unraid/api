import fs from 'fs';
import path from 'path';
import execa from 'execa';
import { spawn, exec } from 'child_process';
import { parse, ArgsParseOptions, ArgumentConfig } from 'ts-command-line-args';
import dotEnv, { config } from 'dotenv';
import findProcess from 'find-process';
import pidUsage from 'pidusage';
import prettyMs from 'pretty-ms';
import dedent from 'dedent-tabs';
import { addExitCallback } from 'catch-exit';
import { version } from '../package.json';
import { paths } from './core/paths';
import { cliLogger, internalLogger, levels } from './core/log';

const setEnv = (envName: string, value: any) => {
	process.env[envName] = String(value);
	cliLogger.debug(`Setting process.env[${envName}] = ${value as string}`);
};

interface Flags {
	command?: string;
	help?: boolean;
	debug?: boolean;
	port?: string;
	'log-level'?: string;
	environment?: string;
	version?: boolean;
}

const args: ArgumentConfig<Flags> = {
	command: { type: String, defaultOption: true, optional: true },
	help: { type: Boolean, optional: true, alias: 'h', description: 'Prints this usage guide.' },
	debug: { type: Boolean, optional: true, alias: 'd', description: 'Enabled debug mode.' },
	port: { type: String, optional: true, alias: 'p', description: 'Set the graphql port.' },
	environment: { type: String, typeLabel: '{underline production/staging/development}', optional: true, description: 'Set the working environment.' },
	'log-level': { type: (level?: string) => {
		return levels.includes(level as any) ? level : undefined;
	}, typeLabel: '{underline error/warn/info/debug/trace/silly}', optional: true, description: 'Set the log level.' },
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

const mainOptions = parse<Flags>(args, { ...options, partial: true, stopAtFirstUnknown: true });
const command: string = (mainOptions as any).command;

const getUnraidApiPid = async () => {
	// Find all processes called "unraid-api" which aren't this process
	const pids = await findProcess('name', 'unraid-api', true);
	return pids.find(_ => _.pid !== process.pid)?.pid;
};

const logToSyslog = (text: string) => execa.commandSync(`logger -t unraid-api[${process.pid}] ${text}`);

const commands = {
	/**
	 * Start a new API process.
	 */
	async start() {
		// Set process title
		process.title = 'unraid-api';

		// Set cwd
		process.chdir(paths.get('unraid-api-base')!);

		const apiVersion: string = version;
		cliLogger.info('Starting unraid-api@v%s', apiVersion);

		// If we're in debug mode or we're NOT
		// in debug but ARE in the child process
		if (mainOptions.debug || process.env._DAEMONIZE_PROCESS) {
			// Log when the API exits
			addExitCallback((signal, exitCode, error) => {
				if (exitCode === 0 || exitCode === 130 || signal === 'SIGTERM') {
					logToSyslog('👋 Farewell. UNRAID API shutting down!');
					return;
				}

				// Log when the API crashes
				if (signal === 'uncaughtException' && error) {
					logToSyslog(`⚠️ Caught exception: ${error.message}`);
				}

				// Log when we crash
				if (exitCode) {
					logToSyslog(`⚠️ UNRAID API crashed with exit code ${exitCode}`);
					return;
				}

				logToSyslog('🛑 UNRAID API crashed without an exit code?');
			});

			logToSyslog('✔️ UNRAID API started successfully!');
		}

		// Load bundled index file
		const indexPath = './index.js';
		require(indexPath);

		if (!mainOptions.debug) {
			if ('_DAEMONIZE_PROCESS' in process.env) {
				// In the child, clean up the tracking environment variable
				delete process.env._DAEMONIZE_PROCESS;
			} else {
				cliLogger.debug('Daemonizing process.');

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

				cliLogger.debug('Daemonized successfully!');

				// Exit cleanly
				process.exit(0);
			}
		}
	},
	/**
	 * Stop a running API process.
	 */
	async stop() {
		setEnv('LOG_TYPE', 'raw');

		// Find process called "unraid-api"
		const unraidApiPid = await getUnraidApiPid();

		// Bail if we have no process
		if (!unraidApiPid) {
			cliLogger.info('Found no running processes.');
			return;
		}

		cliLogger.info('Stopping unraid-api process...');
		process.kill(unraidApiPid, 'SIGTERM');
		cliLogger.info('Process stopped!');
	},
	/**
	 * Stop a running API process and then start it again.
	 */
	async restart() {
		setEnv('LOG_TYPE', 'raw');

		await this.stop();
		await this.start();
	},
	/**
	 * Print API version.
	 */
	async version() {
		setEnv('LOG_TYPE', 'raw');

		const apiVersion: string = version;
		cliLogger.info(`Unraid API v${apiVersion}`);
	},
	async status() {
		setEnv('LOG_TYPE', 'raw');

		// Find all processes called "unraid-api" which aren't this process
		const unraidApiPid = await getUnraidApiPid();
		if (!unraidApiPid) {
			cliLogger.info('Found no running processes.');
			return;
		}

		const stats = await pidUsage(unraidApiPid);
		cliLogger.info(`API has been running for ${prettyMs(stats.elapsed)} and is in "${process.env.ENVIRONMENT!}" mode!`);
	},
	async report() {
		setEnv('LOG_TYPE', 'raw');

		// Find all processes called "unraid-api" which aren't this process
		const unraidApiPid = await getUnraidApiPid();
		const unraidVersion = fs.existsSync(paths.get('unraid-version')!) ? fs.readFileSync(paths.get('unraid-version')!, 'utf8').split('"')[1] : 'unknown';
		cliLogger.info(
			dedent`
				<-----UNRAID-API-REPORT----->
				Environment: ${process.env.ENVIRONMENT}
				Node API version: ${version} (${unraidApiPid ? 'running' : 'stopped'})
				Unraid version: ${unraidVersion}
				</----UNRAID-API-REPORT----->
			`
		);
	},
	async 'switch-env'() {
		setEnv('LOG_TYPE', 'raw');

		const basePath = paths.get('unraid-api-base')!;
		const envFlashFilePath = paths.get('myservers-env')!;
		const envFile = await fs.promises.readFile(envFlashFilePath, 'utf-8').catch(() => '');

		cliLogger.debug('Checking %s for current ENV, found %s', envFlashFilePath, envFile);

		// Match the env file env="production" which would be [0] = env="production", [1] = env and [2] = production
		const matchArray = /([a-zA-Z]+)=["]*([a-zA-Z]+)["]*/.exec(envFile);
		// Get item from index 2 of the regex match or return undefined
		const [,,currentEnvInFile] = matchArray && matchArray.length === 3 ? matchArray : [];

		let newEnv = 'production';

		// Switch from staging to production
		if (currentEnvInFile === 'staging') {
			newEnv = 'production';
		}

		// Switch from production to staging
		if (currentEnvInFile === 'production') {
			newEnv = 'staging';
		}

		if (currentEnvInFile) {
			cliLogger.debug('Switching from "%s" to "%s"...', currentEnvInFile, newEnv);
		} else {
			cliLogger.debug('No ENV found, setting env to "production"...');
		}

		// Write new env to flash
		const newEnvLine = `env="${newEnv}"`;
		await fs.promises.writeFile(envFlashFilePath, newEnvLine);
		cliLogger.debug('Writing %s to %s', newEnvLine, envFlashFilePath);

		// Copy the new env over to live location before restarting
		const source = path.join(basePath, `.env.${newEnv}`);
		const destination = path.join(basePath, '.env');
		cliLogger.debug('Copying %s to %s', source, destination);
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
			cliLogger.debug('unraid-api is running, restarting...');

			// Restart the process
			return this.restart();
		}

		cliLogger.info('Run "unraid-api start" to start the API.');
	}
};

async function main() {
	// Load .env file
	dotEnv.config();

	// Set envs
	setEnv('LOG_TYPE', process.env.LOG_TYPE ?? (command === 'start' ? 'pretty' : 'raw'));

	cliLogger.debug('Starting CLI...');

	setEnv('DEBUG', mainOptions.debug ?? false);
	setEnv('ENVIRONMENT', process.env.ENVIRONMENT ?? 'production');
	setEnv('PORT', mainOptions.port ?? '9000');
	setEnv('LOG_LEVEL', process.env.LOG_LEVEL ?? mainOptions['log-level'] ?? 'INFO');
	setEnv('LOG_TRANSPORT', process.env.LOG_TRANSPORT ?? 'out');

	if (!command) {
		if (mainOptions.version) {
			await commands.version();
			process.exit(0);
		}

		// Run help command
		parse<Flags>(args, { ...options, partial: true, stopAtFirstUnknown: true, argv: ['-h'] });
	}

	// Unknown command
	if (!Object.keys(commands).includes(command)) {
		throw new Error(`Invalid command "${command}"`);
	}

	// Run the command
	await commands[command]();
}

main().catch((error: unknown) => {
	internalLogger.fatal((error as Error).message);
});
