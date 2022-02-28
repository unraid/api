import segfaultHandler from 'segfault-handler';
segfaultHandler.registerHandler('/var/log/unraid-api/crash.log');

import readLine from 'readline';
import fs from 'fs';
import path from 'path';
import execa from 'execa';
import { spawn, exec } from 'child_process';
import { parse, ArgsParseOptions, ArgumentConfig } from 'ts-command-line-args';
import { Serializer as IniSerializer } from 'multi-ini';
import dotEnv from 'dotenv';
import got from 'got';
import findProcess from 'find-process';
import pidUsage from 'pidusage';
import prettyMs from 'pretty-ms';
import dedent from 'dedent-tabs';
import camelCaseKeys from 'camelcase-keys';
import { addExitCallback } from 'catch-exit';
import { version } from '../package.json';
import { paths } from './core/paths';
import { cliLogger, internalLogger, levels } from './core/log';
import { loadState } from './core/utils/misc/load-state';
import { MyServersConfig } from './types/my-servers-config';
import { MOTHERSHIP_GRAPHQL_LINK } from './consts';
import { parseConfig } from './core/utils/misc/parse-config';
import { CachedServer } from './cache';

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
	}, typeLabel: `{underline ${levels.join('/')}}`, optional: true, description: 'Set the log level.' },
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

		// Write current version to config file
		const configPath = paths.get('myservers-config')!;
		const data = loadState<Partial<MyServersConfig>>(configPath);

		// Ini serializer
		const serializer = new IniSerializer({
			// This ensures it ADDs quotes
			keep_quotes: false
		});

		// Stringify data
		const stringifiedData = serializer.serialize({
			...(data ?? {}),
			api: {
				...data.api ?? {},
				version
			}
		});

		// Update config file
		fs.writeFileSync(configPath, stringifiedData);

		// Start API
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

		const stdoutLogger = readLine.createInterface({
			input: process.stdin,
			output: process.stdout
		});

		stdoutLogger.write('Generating report please standby...');

		// Validation endpoint for API keys
		const KEY_SERVER_KEY_VERIFICATION_ENDPOINT = process.env.KEY_SERVER_KEY_VERIFICATION_ENDPOINT ?? 'https://keys.lime-technology.com/validate/apikey';

		// Find all processes called "unraid-api" which aren't this process
		const unraidApiPid = await getUnraidApiPid();

		// Get unraid-api version
		const unraidVersion = fs.existsSync(paths.get('unraid-version')!) ? fs.readFileSync(paths.get('unraid-version')!, 'utf8').split('"')[1] : 'unknown';
		cliLogger.trace('Got unraid OS version "%s"', unraidVersion);

		// Check if we can resolve mothership's address by fetching the head of the graphql endpoint
		const mothershipCanBeResolved = await got.head(MOTHERSHIP_GRAPHQL_LINK, {
			timeout: {
				request: 1_000 // Wait a maximum of 1s
			}
		}).then(() => true).catch(() => false);
		cliLogger.trace('Connecting to mothership status="%s"', mothershipCanBeResolved ? 'success' : 'failed');

		// Load the myservers.cfg
		const config = camelCaseKeys(parseConfig<MyServersConfig>({
			filePath: paths.get('myservers-config'),
			type: 'ini'
		}), {
			deep: true
		});
		cliLogger.trace('Loaded myservers.cfg');

		// Get API key
		const apiKey = `${config.remote.apikey ?? ''}`.trim();
		const apiKeyExists = apiKey.length === 0 ? 'missing' : 'exists';
		const apiKeyIsValidLength = apiKey.length === 64;
		const apiKeyIsOld = apiKeyIsValidLength && !apiKey.startsWith('unraid_');

		const sendFormToKeyServer = async (url: string, data: Record<string, unknown>) => {
			if (!data) {
				throw new Error('Missing data field.');
			}

			// Create form
			const form = new URLSearchParams();
			Object.entries(data).forEach(([key, value]) => {
				if (value !== undefined) {
					form.append(key, String(value));
				}
			});

			// Convert form to string
			const body = form.toString();

			// Send form
			return got(url, {
				method: 'POST',
				headers: {
					'content-type': 'application/x-www-form-urlencoded'
				},
				body,
				timeout: {
					request: 1_000 // Wait a maximum of 1s
				}
			});
		};

		// Send apiKey to key-server for verification
		const apiKeyIsValidWithKeyServer = await sendFormToKeyServer(KEY_SERVER_KEY_VERIFICATION_ENDPOINT, {
			apikey: apiKey
		}).then(response => response.statusCode === 200 ? JSON.parse(response.body) : { valid: false }).then(response => response.valid).catch(() => false);
		cliLogger.trace('Checked key-server for API key validity status="%s"', apiKeyIsValidWithKeyServer ? 'valid' : 'invalid');

		// Query local graphl using upc's API key
		// Get the servers array
		const servers = unraidApiPid ? await got('http://unix:/var/run/unraid-api.sock:/graphql', {
			method: 'POST',
			headers: {
				'x-api-key': config.upc.apikey
			},
			timeout: {
				request: 1_000 // Wait a maximum of 1s
			},
			body: 'query: "query initialGetServers {\n  servers {\n    name\n    guid\n    status\n    owner {\n      username\n    }\n  }\n}\n"'
		}).then(response => JSON.parse(response.body) as CachedServer[]).catch(error => {
			cliLogger.trace('Failed fetching servers from local graphql with "%s"', error.message);
			return [];
		}) : [];
		if (unraidApiPid) cliLogger.trace('Fetched %s server(s) from local graphql', servers.length);
		else cliLogger.trace('Skipped checking for servers as local graphql is offline');

		// Should hints be enabled?
		const hints = process.argv.includes('--hints');

		// Should we output a basic report or one that supports markdown?
		const markdown = process.argv.includes('--markdown');

		// Should we log possibly sensative info?
		const verboseLogs = process.argv.includes('-v');

		// Convert server to string output
		const serverToString = (server: CachedServer) => `${server.name}${verboseLogs ? `[status="${server.status}" guid="${server.guid}"]` : `[status="${server.status}"]`}`;

		// Get all the types of servers including ones that don't have a online/offline status
		const onlineServers = servers.filter(server => server.status === 'online').map(server => serverToString(server));
		const offlineServers = servers.filter(server => server.status === 'offline').map(server => serverToString(server));
		const invalidServers = servers.filter(server => server.status !== 'online' && server.status !== 'offline').map(server => serverToString(server));

		const serversDetails = dedent`
			ONLINE_SERVERS: ${onlineServers.join(', ')}
			OFFLINE_SERVERS: ${offlineServers.join(', ')}${invalidServers.length > 0 ? `\nINVALID_SERVERS: ${invalidServers.join(', ')}` : ''}
		`;

		// Check if API has crashed and if it has crash logs
		const hasCrashLogs = (await fs.promises.stat('/var/log/unraid-api/crash.log').catch(error => ({ size: 0 }))).size > 0;

		// Generate the actual report
		const report = dedent`
			<-----UNRAID-API-REPORT----->
			ENVIRONMENT: ${process.env.ENVIRONMENT}
			NODE_API_VERSION: ${version} (${unraidApiPid ? 'running' : 'stopped'})
			UNRAID_VERSION: ${unraidVersion}
			CAN_REACH_MOTHERSHIP: ${mothershipCanBeResolved ? 'yes' : `no${hints ? ' (Your network may be blocking our cloud servers mothership.unraid.net)' : ''}`}
			API_KEY_STATUS: ${apiKeyIsValidWithKeyServer ? 'valid' : (apiKeyIsOld ? 'old' : apiKeyExists)}
			${servers ? serversDetails : 'SERVERS: none found'}
			HAS_CRASH_LOGS: ${hasCrashLogs ? 'yes' : 'no'}
			</----UNRAID-API-REPORT----->
		`;

		// If we have a crash log grab it for later
		const crashLogs = hasCrashLogs ? dedent`
			<-----UNRAID-API-CRASH-LOGS----->
			${fs.promises.readFile('/var/log/unraid-api/crash.log').catch(() => '')}
			<-----UNRAID-API-CRASH-LOGS----->
		` : '';

		// Either output markdown or just a simple report
		const output = markdown ? dedent`
			\`\`\`
			${report}
			${crashLogs}
			\`\`\`
		` as string : dedent`
			${report}
			${crashLogs}
		` as string;

		// Clear the original log about the report being generated
		readLine.cursorTo(process.stdout, 0, 0);
		readLine.clearScreenDown(process.stdout);

		// eslint-disable-next-line no-warning-comments
		// TODO: Add connection status to mini-graph and relay
		stdoutLogger.write(output + '\n');

		// Close the readLine instance
		stdoutLogger.close();
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

		cliLogger.info('Now using %s', newEnv);
		cliLogger.info('Run "unraid-api start" to start the API.');
	}
};

async function main() {
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

	// Only segfault in a specific mode
	if (process.env.PLEASE_SEGFAULT_FOR_ME) {
		// Wait 30s and then segfault
		setTimeout(() => {
			segfaultHandler.causeSegfault();
		}, 30_000);
	}
}

main().catch((error: unknown) => {
	internalLogger.fatal((error as Error).message);
});
