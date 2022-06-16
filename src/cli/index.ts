import segfaultHandler from 'segfault-handler';
import ipRegex from 'ip-regex';
import readLine from 'readline';
import fs from 'fs';
import path, { resolve } from 'path';
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
import { fullVersion, version } from '../package.json';
import { paths } from '../core/paths';
import { cliLogger, internalLogger, levels } from '../core/log';
import { loadState } from '../core/utils/misc/load-state';
import { MyServersConfig } from '../types/my-servers-config';
import { parseConfig } from '../core/utils/misc/parse-config';
import type { Cloud } from '../graphql/resolvers/query/cloud';
import { validateApiKey } from '../core/utils/misc/validate-api-key';
import { relayStateToHuman } from '../graphql/relay-state';
import { CachedServer } from '../cache/user';
import { myServersConfig } from '../common/myservers-config';

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
}

const args: ArgumentConfig<Flags> = {
	command: { type: String, defaultOption: true, optional: true },
	help: { type: Boolean, optional: true, alias: 'h', description: 'Prints this usage guide.' },
	debug: { type: Boolean, optional: true, alias: 'd', description: 'Enabled debug mode.' },
	port: { type: String, optional: true, alias: 'p', description: 'Set the graphql port.' },
	environment: { type: String, typeLabel: '{underline production/staging/development}', optional: true, description: 'Set the working environment.' },
	'log-level': { type: (level?: string) => {
		return levels.includes(level as any) ? level : undefined;
	}, typeLabel: `{underline ${levels.join('/')}}`, optional: true, description: 'Set the log level.' }
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
		process.chdir(paths['unraid-api-base']);

		// Write current version to config file
		const configPath = paths['myservers-config'];
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
				...data?.api ?? {},
				version
			}
		});

		// Update config file
		fs.writeFileSync(configPath, stringifiedData);

		// Start API
		cliLogger.info('Starting unraid-api@v%s', fullVersion as string);

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
					cwd: paths['unraid-api-base'],
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

		cliLogger.info(`Unraid API v${fullVersion as string}`);
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
	// eslint-disable-next-line complexity
	async report() {
		const getConfig = <T = unknown>(path: string) => {
			try {
				return camelCaseKeys(parseConfig<T>({
					filePath: path,
					type: 'ini'
				}), {
					deep: true
				});
			} catch {}

			return undefined;
		};

		// Which report does the user want?

		// Check if the user has raw output enabled
		const rawOutput = process.argv.includes('--raw');

		// Check if we have a tty attached to stdout
		// If we don't then this is being piped to a log file, etc.
		const hasTTY = process.stdout.isTTY;

		// Check if we should show interactive logs
		// If this has a tty it's interactive
		// AND
		// If they don't have --raw
		const isIteractive = hasTTY && !rawOutput;

		// Check if they want a super fancy report
		const isFancyPants = isIteractive && process.env.THE_FANCIEST_OF_PANTS_PLEASE;

		// Check if they want the less fancy version
		const isNotSoFancy = !isFancyPants;

		const stdoutLogger = readLine.createInterface({
			input: process.stdin,
			output: process.stdout
		});

		try {
			setEnv('LOG_TYPE', 'raw');

			// Show loading message
			if (isIteractive) {
				stdoutLogger.write('Generating report please standby…');
			}

			// Find all processes called "unraid-api" which aren't this process
			const unraidApiPid = await getUnraidApiPid();

			// Get unraid OS version
			const unraidVersion = fs.existsSync(paths['unraid-version']) ? fs.readFileSync(paths['unraid-version'], 'utf8').split('"')[1] : 'unknown';
			cliLogger.trace('Got unraid OS version "%s"', unraidVersion);

			// Load the myservers.cfg
			const myServersConfigPath = paths['myservers-config'];
			const config = getConfig<Partial<MyServersConfig>>(myServersConfigPath);
			if (!config) throw new Error(`Failed loading "${myServersConfigPath}"`);
			if (!config.upc?.apikey) throw new Error('Missing UPC API key');

			// Create default settings for got
			const headers = {
				Origin: '/var/run/unraid-cli.sock',
				'Content-Type': 'application/json',
				'x-api-key': config.upc.apikey
			};
			const timeout = {
				request: 10_000 // Wait a maximum of 10s
			};
			const gotOpts = { headers, timeout };

			// Fetch the cloud endpoint
			// This should return the status of the apiKey, relay and mothership
			const cloud = config?.upc?.apikey ? await got('http://unix:/var/run/unraid-api.sock:/graphql', {
				method: 'POST',
				...gotOpts,
				body: JSON.stringify({
					query: 'query{cloud{error apiKey{valid error}relay{status timeout error}mothership{status error}allowedOrigins}}'
				})
			}).then(response => JSON.parse(response.body)?.data.cloud as Cloud).catch(error => {
				cliLogger.trace('Failed fetching cloud from local graphql with "%s"', error.message);
				return undefined;
			}) : undefined;

			// Log cloud response
			cliLogger.trace('Cloud response %s', JSON.stringify(cloud, null, 0));

			// Query local graphl using upc's API key
			// Get the servers array
			const servers = unraidApiPid && config?.upc?.apikey && cloud ? await got('http://unix:/var/run/unraid-api.sock:/graphql', {
				method: 'POST',
				...gotOpts,
				body: JSON.stringify({
					query: 'query{servers{name guid status owner{username}}}'
				})
			}).then(response => (JSON.parse(response.body)?.data.servers as CachedServer[] ?? [])).catch(error => {
				cliLogger.trace('Failed fetching servers from local graphql with "%s"', error.message);
				return [];
			}) : [];
			if (unraidApiPid) cliLogger.trace('Fetched %s server(s) from local graphql', servers.length);
			else cliLogger.trace('Skipped checking for servers as local graphql is offline');

			// Should we log possibly sensative info?
			const verbose = process.argv.includes('-v');
			const veryVerbose = process.argv.includes('-vv');

			// Convert server to string output
			const serverToString = (server: CachedServer) => `${server.name}${(verbose || veryVerbose) ? `[owner="${server.owner.username}"${veryVerbose ? ` guid="${server.guid}"]` : ']'}` : ''}`;

			// Get all the types of servers including ones that don't have a online/offline status
			const onlineServers = servers.filter(server => server.status === 'online').map(server => serverToString(server));
			const offlineServers = servers.filter(server => server.status === 'offline').map(server => serverToString(server));
			const invalidServers = servers.filter(server => server.status !== 'online' && server.status !== 'offline').map(server => serverToString(server));

			const serversDetails = unraidApiPid ? dedent`
				ONLINE_SERVERS: ${onlineServers.join(', ')}
				OFFLINE_SERVERS: ${offlineServers.join(', ')}${invalidServers.length > 0 ? `\nINVALID_SERVERS: ${invalidServers.join(', ')}` : ''}
			` : dedent`
				SERVERS: API is offline
			`;

			// Check if API has crashed and if it has crash logs
			const hasCrashLogs = (await fs.promises.stat('/var/log/unraid-api/crash.log').catch(() => ({ size: 0 }))).size > 0;

			// Load the var.ini file
			const varIni = getConfig<{ name: string }>(resolve(paths.states, 'var.ini'));
			const serverName = varIni?.name ?? 'Tower';

			// Check if the API key is valid
			// If the API is offline check directly with key-server
			const isApiKeyValid = cloud?.apiKey.valid ?? await validateApiKey(config.remote?.apikey ?? '', false);

			// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
			const relayError = cloud?.relay.error || undefined;
			const relayStatus = relayError ?? relayStateToHuman(cloud?.relay.status) ?? 'disconnected';
			const relayDetails = relayStatus === 'disconnected' ? (cloud?.relay.timeout ? `reconnecting in ${prettyMs(Number(cloud?.relay.timeout))} ${cloud.relay.error ? `[${cloud.relay.error}]` : ''}` : 'disconnected') : relayStatus;

			const hashUrlRegex = () => /(.*)([a-z0-9]{40})(.*)/g;

			const anonymiseOrigins = (origins?: string[]): string[] => {
				const originsWithoutSocks = origins?.filter(url => !url.endsWith('.sock')) ?? [];
				return originsWithoutSocks.map(origin => {
					return origin
						// Replace 40 char hash string with "HASH"
						.replace(hashUrlRegex(), '$1HASH$3')
						// Replace ipv4 address using . separator with "IPV4ADDRESS"
						.replace(ipRegex(), 'IPV4ADDRESS')
						// Replace ipv4 address using - separator with "IPV4ADDRESS"
						.replace(new RegExp(ipRegex().toString().replace('\\.', '-')), '/IPV4ADDRESS')
						// Report WAN port
						.replace(`:${myServersConfig.remote?.wanport ?? 443}`, ':WANPORT');
				}).filter(Boolean);
			};

			const getAllowedOrigins = () => {
				switch (true) {
					case veryVerbose:
						return cloud?.allowedOrigins.filter(url => !url.endsWith('.sock')) ?? [];
					case verbose:
						return anonymiseOrigins(cloud?.allowedOrigins ?? []);
					default:
						return [];
				}
			};

			// Generate the actual report
			const report = dedent`
				<-----UNRAID-API-REPORT----->
				SERVER_NAME: ${serverName}
				ENVIRONMENT: ${process.env.ENVIRONMENT}
				UNRAID_VERSION: ${unraidVersion}
				UNRAID_API_VERSION: ${fullVersion} (${unraidApiPid ? 'running' : 'stopped'})
				NODE_VERSION: ${process.version}
				API_KEY: ${(cloud?.apiKey.valid ?? isApiKeyValid) ? 'valid' : (cloud?.apiKey.error ?? 'invalid')}
				MY_SERVERS: ${config?.remote?.username ? 'authenticated' : 'signed out'}${config?.remote?.username ? `\nMY_SERVERS_USERNAME: ${config?.remote?.username}` : ''}
				RELAY: ${relayDetails}
				MOTHERSHIP: ${cloud?.mothership.error ?? cloud?.mothership.status ?? 'disconnected'}
				${servers ? serversDetails : 'SERVERS: none found'}
				${(verbose || veryVerbose) ? `ALLOWED_ORIGINS: ${getAllowedOrigins().join(', ')}` : ''}
				HAS_CRASH_LOGS: ${hasCrashLogs ? 'yes' : 'no'}
				</----UNRAID-API-REPORT----->
			`.replace(/\n+/g, '\n');

			// If we have a crash log grab it for later
			const crashLogs = hasCrashLogs ? dedent`
				<-----UNRAID-API-CRASH-LOGS----->
				${await fs.promises.readFile('/var/log/unraid-api/crash.log', 'utf-8').catch(() => '')}
				<-----UNRAID-API-CRASH-LOGS----->
			` : '';

			// Should we output a basic report or one that supports markdown?
			const markdown = process.argv.includes('--markdown');
			const output = markdown ? dedent`
				\`\`\`
				${report}
				${crashLogs}
				\`\`\`
			` as string : dedent`
				${report}
				${crashLogs}
			` as string;

			// If we have trace logs or the user selected --raw don't clear the screen
			if (process.env.LOG_LEVEL !== 'trace' && isIteractive && !isFancyPants) {
				// Clear the original log about the report being generated
				readLine.cursorTo(process.stdout, 0, 0);
				readLine.clearScreenDown(process.stdout);
			}

			process.stdout.write(output + '\n');
		} catch (error: unknown) {
			if (error instanceof Error) {
				cliLogger.trace(error);
				stdoutLogger.write(`\nFailed generating report with "${error.message}"\n`);
				return;
			}

			process.stdout.write(`${error as string}`);
		} finally {
			// Close the readLine instance
			stdoutLogger.close();
		}
	},
	async 'switch-env'() {
		setEnv('LOG_TYPE', 'raw');

		const basePath = paths['unraid-api-base'];
		const envFlashFilePath = paths['myservers-env'];
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

export const main = async () => {
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
	await commands[command]();

	// Only segfault in a specific mode
	if (process.env.PLEASE_SEGFAULT_FOR_ME) {
		// Wait 30s and then segfault
		setTimeout(() => {
			segfaultHandler.causeSegfault();
		}, 30_000);
	}
};
