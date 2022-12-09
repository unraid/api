import ipRegex from 'ip-regex';
import readLine from 'readline';
import { got } from 'got';
import { type MyServersConfig } from '@app/types/my-servers-config';
import { parseConfig } from '@app/core/utils/misc/parse-config';
import type { Cloud } from '@app/graphql/resolvers/query/cloud/create-response';
import { validateApiKey } from '@app/core/utils/misc/validate-api-key';
import { setEnv } from '@app/cli/set-env';
import { getUnraidApiPid } from '@app/cli/get-unraid-api-pid';
import { existsSync, readFileSync } from 'fs';
import { cliLogger } from '@app/core/log';
import { resolve } from 'path';
import { getters, store } from '@app/store';
import { stdout } from 'process';
import { loadConfigFile } from '@app/store/modules/config';
import { type Server } from '@app/store/modules/servers';

type Verbosity = '' | '-v' | '-vv';

type ServersPayload = {
	online: Server[];
	offline: Server[];
	invalid: Server[];
};

type ReportObject = {
	os: {
		serverName: string;
		version: string;
	};
	api: {
		version: string;
		status: 'running' | 'stopped';
		environment: string;
		nodeVersion: string;
	};
	apiKey: 'valid' | 'invalid' | string;
	servers?: ServersPayload | null;
	myServers: {
		status: 'authenticated' | 'signed out';
		myServersUsername?: string;
	};
	minigraph: {
		status: 'disconnected' | 'connected';
	};
	cloud: {
		status: 'error' | 'ok';
		error?: string;
		ip?: string;
		allowedOrigins?: string[] | null;
	};
};

export const createGotOptions = (config: Partial<MyServersConfig>) => {
	// Create default settings for got
	const headers = {
		Origin: '/var/run/unraid-cli.sock',
		'Content-Type': 'application/json',
		'x-api-key': config.upc?.apikey,
	};
	const timeout = {
		request: 10_000, // Wait a maximum of 10s
	};

	return { headers, timeout };
};

// This should return the status of the apiKey and mothership
export const getCloudData = async (config: Partial<MyServersConfig>): Promise<Cloud | undefined> => {
	const cloud = config?.upc?.apikey ? await got('http://unix:/var/run/unraid-api.sock:/graphql', {
		method: 'POST',
		...createGotOptions(config),
		body: JSON.stringify({
			query: /* GraphQL */`
			query {
				cloud {
					error 
					apiKey {
						valid
					}
					minigraphql {
						status
					}
					cloud {
						status 
						error 
						ip
					}
					allowedOrigins
					emhttp {
						mode
					}
				}
			}
			`,
		}),
	}).then(response => JSON.parse(response.body)?.data.cloud as Cloud).catch(error => {
		cliLogger.trace('Failed fetching cloud from local graphql with "%s"', error.message);
		return undefined;
	}) : undefined;

	return cloud;
};

export const getServersData = async ({ isApiRunning, cloud, config, v }: { isApiRunning: boolean; cloud: Cloud | undefined; config: Partial<MyServersConfig>; v: Verbosity }):
Promise<ServersPayload | null> => {
	if (v === '') {
		return null;
	}

	const servers = isApiRunning && config?.upc?.apikey && cloud ? await got('http://unix:/var/run/unraid-api.sock:/graphql', {
		method: 'POST',
		...createGotOptions(config),
		body: JSON.stringify({
			query: 'query{servers{name guid status owner{username}}}',
		}),
	}).then(response => (JSON.parse(response.body)?.data.servers as Server[] ?? [])).catch(error => {
		cliLogger.trace('Failed fetching servers from local graphql with "%s"', error.message);
		return [];
	}) : [];

	const online = servers.filter(server => server.status === 'online');
	const offline = servers.filter(server => server.status === 'offline');
	const invalid = servers.filter(server => server.status !== 'online' && server.status !== 'offline');
	return {
		online, offline, invalid,
	};
};

const hashUrlRegex = () => /(.*)([a-z0-9]{40})(.*)/g;

export const anonymiseOrigins = (origins?: string[]): string[] => {
	const originsWithoutSocks = origins?.filter(url => !url.endsWith('.sock')) ?? [];
	return originsWithoutSocks.map(origin => origin
		// Replace 40 char hash string with "HASH"
		.replace(hashUrlRegex(), '$1HASH$3')
		// Replace ipv4 address using . separator with "IPV4ADDRESS"
		.replace(ipRegex(), 'IPV4ADDRESS')
		// Replace ipv4 address using - separator with "IPV4ADDRESS"
		.replace(new RegExp(ipRegex().toString().replace('\\.', '-')), '/IPV4ADDRESS')
		// Report WAN port
		.replace(`:${getters.config().remote.wanport || 443}`, ':WANPORT')).filter(Boolean);
};

const getAllowedOrigins = (cloud: Cloud | undefined, v: Verbosity): string[] | null => {
	switch (v) {
		case '-vv':
			return cloud?.allowedOrigins.filter(url => !url.endsWith('.sock')) ?? [];
		case '-v':
			return anonymiseOrigins(cloud?.allowedOrigins ?? []);
		default:
			return null;
	}
};

const getUnraidVersion = async (paths: ReturnType<typeof getters.paths>): Promise<string> => {
	// Get unraid OS version
	const unraidVersion = existsSync(paths['unraid-version']) ? readFileSync(paths['unraid-version'], 'utf8').split('"')[1] : 'unknown';
	cliLogger.trace('Got unraid OS version "%s"', unraidVersion);
	return unraidVersion;
};

const getReadableCloudDetails = (reportObject: ReportObject, v: Verbosity): string => {
	const error = reportObject.cloud.error ? `\n	ERROR [${reportObject.cloud.error}]` : '';
	const status = reportObject.cloud.status ? reportObject.cloud.status : 'disconnected';
	const ip = reportObject.cloud.ip && v !== '' ? `\n	IP: [${reportObject.cloud.ip}]` : '';
	return `
	STATUS: [${status}] ${ip} ${error}`;
};

const getReadableMinigraphDetails = (reportObject: ReportObject): string => `
	STATUS: [${reportObject.minigraph.status}]`;

// Convert server to string output
const serverToString = (v: Verbosity) => (server: Server) => `${server.name}${(v === '-v' || v === '-vv') ? `[owner="${server.owner.username}"${v === '-vv' ? ` guid="${server.guid}"]` : ']'}` : ''}`;

const getReadableServerDetails = (reportObject: ReportObject, v: Verbosity): string => {
	if (!reportObject.servers) {
		return '';
	}

	if (reportObject.api.status === 'stopped') {
		return '\nSERVERS: API is offline';
	}

	const invalid = (v === '-v' || v === '-vv') && reportObject.servers.invalid.length > 0 ? `
	INVALID: ${reportObject.servers.invalid.map(serverToString(v)).join(',')}` : '';

	return `
SERVERS:
	ONLINE: ${reportObject.servers.online.map(serverToString(v)).join(',')}
	OFFLINE: ${reportObject.servers.offline.map(serverToString(v)).join(',')}${invalid}`;
};

const getReadableAllowedOrigins = (reportObject: ReportObject): string => {
	const { cloud } = reportObject;
	if (cloud?.allowedOrigins) {
		return `
ALLOWED_ORIGINS: ${cloud.allowedOrigins.join(', ').trim()}`;
	}

	return '';
};

const getServerName = async (paths: ReturnType<typeof getters.paths>): Promise<string> => {
	// Load the var.ini file
	let serverName = 'Tower';
	try {
		const varIni = parseConfig<{ name: string }>({ filePath: resolve(paths.states, 'var.ini'), type: 'ini' });
		if (varIni.name) {
			serverName = varIni.name;
		}
	} catch (error: unknown) {
		cliLogger.error('Error loading states ini for report, defaulting server name to Tower');
	}

	return serverName;
};

const getVerbosity = (argv: string[]): Verbosity => {
	if (argv.includes('-v')) {
		return '-v';
	}

	if (argv.includes('-vv')) {
		return '-vv';
	}

	return '';
};

// eslint-disable-next-line complexity
export const report = async (...argv: string[]) => {
	// Check if the user has raw output enabled
	const rawOutput = argv.includes('--raw');

	// Check if we have a tty attached to stdout
	// If we don't then this is being piped to a log file, etc.
	const hasTty = process.stdout.isTTY;

	// Check if we should show interactive logs
	// If this has a tty it's interactive
	// AND
	// If they don't have --raw
	const isInteractive = hasTty && !rawOutput;

	const stdoutLogger = readLine.createInterface({
		input: process.stdin,
		output: process.stdout,
	});

	try {
		setEnv('LOG_TYPE', 'raw');

		// Show loading message
		if (isInteractive) {
			stdoutLogger.write('Generating report please wait…');
		}

		const jsonReport = argv.includes('--json');
		const v = getVerbosity(argv);

		// Find all processes called "unraid-api" which aren't this process
		const unraidApiPid = await getUnraidApiPid();
		const isApiRunning = typeof unraidApiPid === 'number';

		const paths = getters.paths();

		// Load my servers config file into store
		await store.dispatch(loadConfigFile());

		const { config } = store.getState();
		if (!config.upc.apikey) throw new Error('Missing UPC API key');

		// Fetch the cloud endpoint
		const cloud = await getCloudData(config);

		// Log cloud response
		cliLogger.trace('Cloud response %s', JSON.stringify(cloud, null, 0));

		cliLogger.trace('Here to fix errros');

		// Query local graphql using upc's API key
		// Get the servers array
		const servers = await getServersData({ isApiRunning, cloud, config, v });

		// Check if the API key is valid
		// If the API is offline check directly with key-server
		const isApiKeyValid = cloud?.apiKey.valid ?? await validateApiKey(config.remote?.apikey ?? '', false);

		const reportObject: ReportObject = {
			os: {
				serverName: await getServerName(paths),
				version: await getUnraidVersion(paths),
			},
			api: {
				version: getters.config().api.version,
				status: unraidApiPid ? 'running' : 'stopped',
				environment: process.env.ENVIRONMENT ?? 'THIS_WILL_BE_REPLACED_WHEN_BUILT',
				nodeVersion: process.version,
			},
			apiKey: (cloud?.apiKey.valid ?? isApiKeyValid) ? 'valid' : (cloud?.apiKey.error ?? 'invalid'),
			...(servers ? { servers } : {}),
			myServers: {
				status: config?.remote?.username ? 'authenticated' : 'signed out',
				...(config?.remote?.username ? { myServersUsername: config?.remote?.username } : {}),
			},
			minigraph: {
				status: cloud?.minigraphql.status ?? 'disconnected',
			},
			cloud: {
				status: cloud?.cloud.status ?? 'error',
				...(cloud?.cloud.error ? { error: cloud.cloud.error } : {}),
				...(cloud?.cloud.status === 'ok' ? { ip: cloud.cloud.ip } : {}),
				...(getAllowedOrigins(cloud, v) ? { allowedOrigins: getAllowedOrigins(cloud, v) } : {}),
			},
		};

		// If we have trace logs or the user selected --raw don't clear the screen
		if (process.env.LOG_LEVEL !== 'trace' && isInteractive) {
			// Clear the original log about the report being generated
			readLine.cursorTo(process.stdout, 0, 0);
			readLine.clearScreenDown(process.stdout);
		}

		if (jsonReport) {
			stdout.write(JSON.stringify(reportObject) + '\n');
			return;
		}

		// Generate the actual report
		const report = `
<-----UNRAID-API-REPORT----->
SERVER_NAME: ${reportObject.os.serverName}
ENVIRONMENT: ${reportObject.api.environment}
UNRAID_VERSION: ${reportObject.os.version}
UNRAID_API_VERSION: ${reportObject.api.version}
UNRAID_API_STATUS: ${reportObject.api.status}
API_KEY: ${reportObject.apiKey}
MY_SERVERS: ${reportObject.myServers.status}${reportObject.myServers.myServersUsername ? `\nMY_SERVERS_USERNAME: ${reportObject.myServers.myServersUsername}` : ''}
CLOUD: ${getReadableCloudDetails(reportObject, v)}
MINI-GRAPH: ${getReadableMinigraphDetails(reportObject)}${getReadableServerDetails(reportObject, v)}${getReadableAllowedOrigins(reportObject)}
</----UNRAID-API-REPORT----->
`;

		stdout.write(report);
	} catch (error: unknown) {
		console.log({ error });
		if (error instanceof Error) {
			cliLogger.trace(error);
			stdoutLogger.write(`\nFailed generating report with "${error.message}"\n`);
			return;
		}

		stdout.write(`${error as string}`);
	} finally {
		// Close the readLine instance
		stdoutLogger.close();
	}
};
