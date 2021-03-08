import fs from 'fs';
import { spawn } from 'child_process';
import { parse, ArgsParseOptions, ArgumentConfig } from 'ts-command-line-args';
import dotEnv from 'dotenv';
import findProcess from 'find-process';
import pidusage from 'pidusage';
import prettyMs from 'pretty-ms';
import dedent from 'dedent';
import { version } from '../package.json';

const setEnv = (envName: string, value: any) => {
	if (!value || String(value).trim().length === 0) {
		return;
	}

	process.env[envName] = String(value);
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

const args: ArgumentConfig<Flags> = {
	command: { type: String, defaultOption: true, optional: true },
	help: { type: Boolean, optional: true, alias: 'h', description: 'Prints this usage guide.' },
	debug: { type: Boolean, optional: true, alias: 'd', description: 'Enabled debug mode.' },
	port: { type: String, optional: true, alias: 'p', description: 'Set the graphql port.' },
	environment: { type: String, typeLabel: '{underline production/staging/development}', optional: true, description: 'Set the working environment.' },
	'log-level': { type: (level?: string) => {
		return ['error', 'warn', 'info', 'debug', 'trace', 'silly'].includes(level ?? 'info') ? level : 'info';
	}, typeLabel: '{underline error/warn/info/debug/trace/silly}', optional: true, description: 'Set the log level.' },
	'log-transport': { type: (level?: string) => {
		return ['console', 'syslog'].includes(level ?? 'info') ? level : 'info';
	}, typeLabel: '{underline console/syslog}', optional: true, description: 'Set the log transport. (default=syslog)' },
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
const commandOptions = (mainOptions as Flags & { _unknown: string[] })._unknown || [];
const command: string = (mainOptions as any).command;
const environment = mainOptions.environment ?? 'production';
const commands = {
	/**
   * Start a new API process.
   */
	async start() {
		// Load .env file
		dotEnv.config();

		// Set process title
		process.title = 'unraid-api';

		// Set envs
		setEnv('DEBUG', mainOptions.debug);
		setEnv('ENVIRONMENT', environment);
		setEnv('LOG_LEVEL', mainOptions['log-level']);
		setEnv('LOG_TRANSPORT', mainOptions['log-transport']);
		setEnv('PORT', mainOptions.port);

		console.log(`Starting unraid-api in "${environment}" mode.`);

		// Load bundled index file
		const indexPath = './index.js';
		require(indexPath);

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
					cwd: '/sandbox/unraid-api',
					stdio: 'ignore',
					detached: true
				});

				// Convert process into daemon
				child.unref();

				console.log('Daemonized successfully!');

				// Exit cleanly
				process.exit(0);
			}
		}
	},
	/**
   * Stop a running API process.
   */
	async stop() {
		// Find and kill all processes called "unraid-api"
		const foundProcesses = await findProcess('name', 'unraid-api');

		if (foundProcesses.length <= 1) {
			console.log('Found no running processes.');
			return;
		}

		foundProcesses.forEach(foundProcess => {
			// Don't kill ourselves as we'll exit once this is done
			if (foundProcess.pid === process.pid) {
				return;
			}

			console.log(`Sending process ${foundProcess.pid} SIGKILL.`);
			process.kill(foundProcess.pid, 'SIGKILL');
		});
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
		console.log(`Unraid API v${version as string}`);
	},
	async status() {
		// Find and kill all processes called "unraid-api"
		const foundProcesses = await findProcess('name', 'unraid-api');
		if (foundProcesses.length <= 1) {
			console.log('Found no running processes.');
			return;
		}

		const stats = await pidusage(foundProcesses[0].pid);
		console.log(`API has been running for ${prettyMs(stats.elapsed)} and is in "${environment}" mode!`);
	},
	async report() {
		// Find all processes called "unraid-api"
		const foundProcesses = await findProcess('name', 'unraid-api');
		const unraidVersion = fs.existsSync('/etc/unraid-version') ? fs.readFileSync('/etc/unraid-version', 'utf8').split('"')[1] : 'unknown';
		console.log(dedent`
      <-----UNRAID-API-REPORT----->
      Environment: ${environment}
      Node API version: ${version} (${foundProcesses.length >= 2 ? 'running' : 'stopped'})
      Unraid version: ${unraidVersion}
      </----UNRAID-API-REPORT----->
    `);
	}
};

async function main() {
	if (!command) {
		if (mainOptions.version) {
			await commands.version();
			process.exit();
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
	console.error((error as Error).message);
});
