
import { dedent } from '@app/common/dedent';
import camelCaseKeys from 'camelcase-keys';
import ipRegex from 'ip-regex';
import readLine from 'readline';
import got from 'got';
import { MyServersConfig } from '@app/types/my-servers-config';
import { parseConfig } from '@app/core/utils/misc/parse-config';
import type { Cloud } from '@app/graphql/resolvers/query/cloud/create-response';
import { validateApiKey } from '@app/core/utils/misc/validate-api-key';
import { CachedServer } from '@app/cache/user';
import { myServersConfig } from '@app/common/myservers-config';
import { setEnv } from '@app/cli/set-env';
import { getUnraidApiPid } from '@app/cli/get-unraid-api-pid';
import { existsSync, readFileSync } from 'fs';
import { paths } from '@app/core/paths';
import { cliLogger } from '@app/core/log';
import { readFile, stat } from 'fs/promises';
import { resolve } from 'path';
import prettyMs from 'pretty-ms';
import { getters } from '@app/store';
import { stdout } from 'process';

export const getConfig = <T = unknown>(path: string) => {
	try {
		const config = parseConfig<T>({
			filePath: path,
			type: 'ini',
		});
		return camelCaseKeys(config, {
			deep: true,
		});
	} catch {}

	return undefined;
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

// This should return the status of the apiKey, relay and mothership
export const getCloudData = async (config: Partial<MyServersConfig>): Promise<Cloud | undefined> => {
	const cloud = config?.upc?.apikey ? await got('http://unix:/var/run/unraid-api.sock:/graphql', {
		method: 'POST',
		...createGotOptions(config),
		body: JSON.stringify({
			query: 'query{cloud{error apiKey{valid}relay{status timeout error}minigraphql{status}cloud{status error ip}allowedOrigins}}',
		}),
	}).then(response => JSON.parse(response.body)?.data.cloud as Cloud).catch(error => {
		cliLogger.trace('Failed fetching cloud from local graphql with "%s"', error.message);
		return undefined;
	}) : undefined;

	return cloud;
};

export const getServersData = async (unraidApiPid: number | undefined, cloud: Cloud | undefined, config: Partial<MyServersConfig>) => {
	const servers = unraidApiPid && config?.upc?.apikey && cloud ? await got('http://unix:/var/run/unraid-api.sock:/graphql', {
		method: 'POST',
		...createGotOptions(config),
		body: JSON.stringify({
			query: 'query{servers{name guid status owner{username}}}',
		}),
	}).then(response => (JSON.parse(response.body)?.data.servers as CachedServer[] ?? [])).catch(error => {
		cliLogger.trace('Failed fetching servers from local graphql with "%s"', error.message);
		return [];
	}) : [];

	return servers;
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
		.replace(`:${myServersConfig.remote?.wanport ?? 443}`, ':WANPORT')).filter(Boolean);
};

const getAllowedOrigins = (cloud: Cloud | undefined, verbose: boolean, veryVerbose: boolean) => {
	switch (true) {
		case veryVerbose:
			return cloud?.allowedOrigins.filter(url => !url.endsWith('.sock')) ?? [];
		case verbose:
			return anonymiseOrigins(cloud?.allowedOrigins ?? []);
		default:
			return [];
	}
};

// eslint-disable-next-line complexity
export const report = async (...argv: string[]) => {
	// Which report does the user want?

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

	// Check if they want a super fancy report
	const isFancyPants = isInteractive && process.env.THE_FANCIEST_OF_PANTS_PLEASE;

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

		// Find all processes called "unraid-api" which aren't this process
		const unraidApiPid = await getUnraidApiPid();

		// Get unraid OS version
		const unraidVersion = existsSync(paths['unraid-version']) ? readFileSync(paths['unraid-version'], 'utf8').split('"')[1] : 'unknown';
		cliLogger.trace('Got unraid OS version "%s"', unraidVersion);

		// Load the myservers.cfg
		const myServersConfigPath = paths['myservers-config'];
		const config = getConfig<Partial<MyServersConfig>>(myServersConfigPath);
		if (!config) throw new Error(`Failed loading "${myServersConfigPath}"`);
		if (!config.upc?.apikey) throw new Error('Missing UPC API key');

		// Fetch the cloud endpoint
		const cloud = await getCloudData(config);

		// Log cloud response
		cliLogger.trace('Cloud response %s', JSON.stringify(cloud, null, 0));

		// Query local graphql using upc's API key
		// Get the servers array
		const servers = await getServersData(unraidApiPid, cloud, config);
		if (unraidApiPid) cliLogger.trace('Fetched %s server(s) from local graphql', servers.length);
		else cliLogger.trace('Skipped checking for servers as local graphql is offline');

		// Should we log possibly sensitive info?
		const verbose = argv.includes('-v');
		const veryVerbose = argv.includes('-vv');

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
		const hasCrashLogs = (await stat('/var/log/unraid-api/crash.log').catch(() => ({ size: 0 }))).size > 0;

		// Load the var.ini file
		const varIni = getConfig<{ name: string }>(resolve(paths.states, 'var.ini'));
		const serverName = varIni?.name ?? 'Tower';

		// Check if the API key is valid
		// If the API is offline check directly with key-server
		const isApiKeyValid = cloud?.apiKey.valid ?? await validateApiKey(config.remote?.apikey ?? '', false);

		// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
		const relayError = cloud?.relay.error || undefined;
		const relayStatus = relayError ?? cloud?.relay.status ?? 'disconnected';
		const relayDetails = relayStatus === 'disconnected' ? (cloud?.relay.timeout ? `reconnecting in ${prettyMs(Number(cloud?.relay.timeout))} ${relayError ? `[${relayError}]` : ''}` : 'disconnected') : relayStatus;
		const miniGraphqlStatus = cloud?.minigraphql.status ?? 'disconnected';

		const jsonReport = argv.includes('--json');
		if (jsonReport) {
			// If we have trace logs or the user selected --raw don't clear the screen
			if (process.env.LOG_LEVEL !== 'trace' && isInteractive && !isFancyPants) {
				// Clear the original log about the report being generated
				readLine.cursorTo(process.stdout, 0, 0);
				readLine.clearScreenDown(process.stdout);
			}

			const json = JSON.stringify({
				os: {
					serverName,
					version: unraidVersion,
				},
				api: {
					version: getters.config().version,
					status: unraidApiPid ? 'running' : 'stopped',
					environment: process.env.ENVIRONMENT,
				},
				apiKey: (cloud?.apiKey.valid ?? isApiKeyValid) ? 'valid' : (cloud?.apiKey.error ?? 'invalid'),
				servers: {
					offline: servers.filter(server => server.status === 'offline'),
					online: servers.filter(server => server.status === 'online'),
				},
				...(hasCrashLogs ? { crashLogs: await readFile('/var/log/unraid-api/crash.log', 'utf-8').then(lines => lines.split('\n').map(line => {
					try {
						return JSON.parse(line) as string;
					} catch {}

					return undefined;
				}).filter(Boolean)).catch(() => '') } : {}),
				myServers: {
					status: config?.remote?.username ? 'authenticated' : 'signed out',
					...(config?.remote?.username ? { myServersUsername: config?.remote?.username } : {}),
				},
				relay: {
					status: relayStatus,
				},
				minigraph: {
					status: miniGraphqlStatus,
				},
				cloud: {
					status: cloud?.cloud.status,
					...(cloud?.cloud.error ? { error: cloud.cloud.error } : {}),
					...(cloud?.cloud.status === 'ok' ? { ip: cloud.cloud.ip } : {}),
				},
			});
			stdout.write(json + '\n');
			return;
		}

		// Get the IP of mothership
		const cloudIp = cloud?.cloud.status === 'ok' ? `[IP=${cloud?.cloud?.ip}]` : '';

		// Generate the actual report
		const report = dedent`
            <-----UNRAID-API-REPORT----->
            SERVER_NAME: ${serverName}
            ENVIRONMENT: ${process.env.ENVIRONMENT!}
            UNRAID_VERSION: ${unraidVersion}
            UNRAID_API_VERSION: ${getters.config().fullVersion} (${unraidApiPid ? 'running' : 'stopped'})
            NODE_VERSION: ${process.version}
            API_KEY: ${(cloud?.apiKey.valid ?? isApiKeyValid) ? 'valid' : (cloud?.apiKey.error ?? 'invalid')}
            MY_SERVERS: ${config?.remote?.username ? 'authenticated' : 'signed out'}${config?.remote?.username ? `\nMY_SERVERS_USERNAME: ${config?.remote?.username}` : ''}
            CLOUD: ${cloud?.cloud.error ?? (cloud?.cloud.status ? `${cloud?.cloud.status}${(verbose || veryVerbose) ? ` ${cloudIp}` : ''}` : null) ?? 'disconnected'}
            RELAY: ${relayDetails}
            MINI-GRAPH: ${miniGraphqlStatus}
            ${servers ? serversDetails : 'SERVERS: none found'}
            ${(verbose || veryVerbose) ? `ALLOWED_ORIGINS: ${getAllowedOrigins(cloud, verbose, veryVerbose).join(', ')}`.trim() : ''}
            HAS_CRASH_LOGS: ${hasCrashLogs ? 'yes' : 'no'}
            </----UNRAID-API-REPORT----->
        `.replace(/\n+/g, '\n');

		// If we have a crash log grab it for later
		const crashLogs = hasCrashLogs ? `<-----UNRAID-API-CRASH-LOGS----->\n${await readFile('/var/log/unraid-api/crash.log', 'utf-8').catch(() => '')}\n<-----UNRAID-API-CRASH-LOGS----->` : '';

		// Should we output a basic report or one that supports markdown?
		const markdownReport = argv.includes('--markdown');
		const output = markdownReport ? dedent`
            \`\`\`
            ${report}
            ${crashLogs}
            \`\`\`
        ` : dedent`
            ${report}
            ${crashLogs}
        `;

		// If we have trace logs or the user selected --raw don't clear the screen
		if (process.env.LOG_LEVEL !== 'trace' && isInteractive && !isFancyPants) {
			// Clear the original log about the report being generated
			readLine.cursorTo(process.stdout, 0, 0);
			readLine.clearScreenDown(process.stdout);
		}

		stdout.write(output + '\n');
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
