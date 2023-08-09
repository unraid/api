import ipRegex from 'ip-regex';
import readLine from 'readline';
import { setEnv } from '@app/cli/set-env';
import { getUnraidApiPid } from '@app/cli/get-unraid-api-pid';
import { cliLogger } from '@app/core/log';
import { getters, store } from '@app/store';
import { stdout } from 'process';
import { loadConfigFile } from '@app/store/modules/config';
import { getApiApolloClient } from '../../graphql/client/api/get-api-client';
import {
    getCloudDocument,
    getServersDocument,
    type getServersQuery,
    type getCloudQuery,
} from '../../graphql/generated/api/operations';
import {
    type ApolloQueryResult,
    type ApolloClient,
    type NormalizedCacheObject,
} from '@apollo/client/core/core.cjs';
import { MinigraphStatus } from '@app/graphql/generated/api/types';
import { API_VERSION } from '@app/environment';
import { loadStateFiles } from '@app/store/modules/emhttp';

type CloudQueryResult = NonNullable<
    ApolloQueryResult<getCloudQuery>['data']['cloud']
>;
type ServersQueryResultServer = NonNullable<
    ApolloQueryResult<getServersQuery>['data']['servers']
>[0];

type Verbosity = '' | '-v' | '-vv';

type ServersPayload = {
    online: ServersQueryResultServer[];
    offline: ServersQueryResultServer[];
    invalid: ServersQueryResultServer[];
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
        status: MinigraphStatus;
        timeout: number | null;
        error: string | null;
    };
    cloud: {
        status: string;
        error?: string;
        ip?: string;
        allowedOrigins?: string[] | null;
    };
};

// This should return the status of the apiKey and mothership
export const getCloudData = async (
    client: ApolloClient<NormalizedCacheObject>
): Promise<CloudQueryResult | null> => {
    try {
        const cloud = await client.query({ query: getCloudDocument });
        return cloud.data.cloud ?? null;
    } catch (error: unknown) {
        cliLogger.addContext(
            'error-stack',
            error instanceof Error ? error.stack : error
        );
        cliLogger.trace(
            'Failed fetching cloud from local graphql with "%s"',
            error instanceof Error ? error.message : 'Unknown Error'
        );
        cliLogger.removeContext('error-stack');

        return null;
    }
};

export const getServersData = async ({
    client,
    v,
}: {
    client: ApolloClient<NormalizedCacheObject>;
    v: Verbosity;
}): Promise<ServersPayload | null> => {
    if (v === '') {
        return null;
    }

    try {
        const servers = await client.query({ query: getServersDocument });
        const foundServers = servers.data.servers.reduce<ServersPayload>(
            (acc, curr) => {
                switch (curr.status) {
                    case 'online':
                        acc.online.push(curr);
                        break;
                    case 'offline':
                        acc.offline.push(curr);
                        break;
                    default:
                        acc.invalid.push(curr);
                        break;
                }

                return acc;
            },
            { online: [], offline: [], invalid: [] }
        );
        return foundServers;
    } catch (error: unknown) {
        cliLogger.addContext('error', error);
        cliLogger.trace(
            'Failed fetching servers from local graphql with "%s"',
            error instanceof Error ? error.message : 'Unknown Error'
        );
        cliLogger.removeContext('error');
        return {
            online: [],
            offline: [],
            invalid: [],
        };
    }
};

const hashUrlRegex = () => /(.*)([a-z0-9]{40})(.*)/g;

export const anonymiseOrigins = (origins?: string[]): string[] => {
    const originsWithoutSocks =
        origins?.filter((url) => !url.endsWith('.sock')) ?? [];
    return originsWithoutSocks
        .map((origin) =>
            origin
                // Replace 40 char hash string with "HASH"
                .replace(hashUrlRegex(), '$1HASH$3')
                // Replace ipv4 address using . separator with "IPV4ADDRESS"
                .replace(ipRegex(), 'IPV4ADDRESS')
                // Replace ipv4 address using - separator with "IPV4ADDRESS"
                .replace(
                    new RegExp(ipRegex().toString().replace('\\.', '-')),
                    '/IPV4ADDRESS'
                )
                // Report WAN port
                .replace(
                    `:${getters.config().remote.wanport || 443}`,
                    ':WANPORT'
                )
        )
        .filter(Boolean);
};

const getAllowedOrigins = (
    cloud: CloudQueryResult | null,
    v: Verbosity
): string[] | null => {
    switch (v) {
        case '-vv':
            return (
                cloud?.allowedOrigins.filter((url) => !url.endsWith('.sock')) ??
                []
            );
        case '-v':
            return anonymiseOrigins(cloud?.allowedOrigins ?? []);
        default:
            return null;
    }
};

const getReadableCloudDetails = (
    reportObject: ReportObject,
    v: Verbosity
): string => {
    const error = reportObject.cloud.error
        ? `\n	ERROR [${reportObject.cloud.error}]`
        : '';
    const status = reportObject.cloud.status
        ? reportObject.cloud.status
        : 'disconnected';
    const ip =
        reportObject.cloud.ip && v !== ''
            ? `\n	IP: [${reportObject.cloud.ip}]`
            : '';
    return `
	STATUS: [${status}] ${ip} ${error}`;
};

const getReadableMinigraphDetails = (reportObject: ReportObject): string => {
    const statusLine = `STATUS: [${reportObject.minigraph.status}]`;
    const errorLine = reportObject.minigraph.error
        ? `	ERROR: [${reportObject.minigraph.error}]`
        : null;
    const timeoutLine = reportObject.minigraph.timeout
        ? `	TIMEOUT: [${(reportObject.minigraph.timeout || 1) / 1_000}s]`
        : null; // 1 in case of divide by zero

    return `
	${statusLine}${errorLine ? `\n${errorLine}` : ''}${
        timeoutLine ? `\n${timeoutLine}` : ''
    }`;
};

// Convert server to string output
const serverToString = (v: Verbosity) => (server: ServersQueryResultServer) =>
    `${server?.name ?? 'No Server Name'}${
        v === '-v' || v === '-vv'
            ? `[owner="${server.owner?.username ?? 'No Owner Found'}"${
                  v === '-vv' ? ` guid="${server.guid ?? 'No GUID'}"]` : ']'
              }`
            : ''
    }`;

const getReadableServerDetails = (
    reportObject: ReportObject,
    v: Verbosity
): string => {
    if (!reportObject.servers) {
        return '';
    }

    if (reportObject.api.status === 'stopped') {
        return '\nSERVERS: API is offline';
    }

    const invalid =
        (v === '-v' || v === '-vv') && reportObject.servers.invalid.length > 0
            ? `
	INVALID: ${reportObject.servers.invalid.map(serverToString(v)).join(',')}`
            : '';

    return `
SERVERS:
	ONLINE: ${reportObject.servers.online.map(serverToString(v)).join(',')}
	OFFLINE: ${reportObject.servers.offline
        .map(serverToString(v))
        .join(',')}${invalid}`;
};

const getReadableAllowedOrigins = (reportObject: ReportObject): string => {
    const { cloud } = reportObject;
    if (cloud?.allowedOrigins) {
        return `
ALLOWED_ORIGINS: ${cloud.allowedOrigins.join(', ').trim()}`;
    }

    return '';
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

        // Load my servers config file into store
        await store.dispatch(loadConfigFile());
        await store.dispatch(loadStateFiles());

        const { config, emhttp } = store.getState();
        if (!config.upc.apikey) throw new Error('Missing UPC API key');

        const client = getApiApolloClient({ upcApiKey: config.upc.apikey });
        // Fetch the cloud endpoint
        const cloud = await getCloudData(client);

        // Log cloud response
        cliLogger.trace('Cloud response %s', JSON.stringify(cloud, null, 0));

        // Query local graphql using upc's API key
        // Get the servers array
        const servers = await getServersData({ client, v });

        // Check if the API key is valid
        const isApiKeyValid = cloud?.apiKey.valid ?? false;

        const reportObject: ReportObject = {
            os: {
                serverName: emhttp.var.name,
                version: emhttp.var.version
            },
            api: {
                version: API_VERSION,
                status: unraidApiPid ? 'running' : 'stopped',
                environment:
                    process.env.ENVIRONMENT ??
                    'THIS_WILL_BE_REPLACED_WHEN_BUILT',
                nodeVersion: process.version,
            },
            apiKey: isApiKeyValid ? 'valid' : cloud?.apiKey.error ?? 'invalid',
            ...(servers ? { servers } : {}),
            myServers: {
                status: config?.remote?.username
                    ? 'authenticated'
                    : 'signed out',
                ...(config?.remote?.username
                    ? { myServersUsername: config?.remote?.username }
                    : {}),
            },
            minigraph: {
                status: cloud?.minigraphql.status ?? MinigraphStatus.PRE_INIT,
                timeout: cloud?.minigraphql.timeout ?? null,
                error:
                    cloud?.minigraphql.error ?? !cloud?.minigraphql.status
                        ? 'API Disconnected'
                        : null,
            },
            cloud: {
                status: cloud?.cloud.status ?? 'error',
                ...(cloud?.cloud.error ? { error: cloud.cloud.error } : {}),
                ...(cloud?.cloud.status === 'ok'
                    ? { ip: cloud.cloud.ip ?? 'NO_IP' }
                    : {}),
                ...(getAllowedOrigins(cloud, v)
                    ? { allowedOrigins: getAllowedOrigins(cloud, v) }
                    : {}),
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
			stdoutLogger.close();
			return reportObject;
        } else {
            // Generate the actual report
            const report = `
<-----UNRAID-API-REPORT----->
SERVER_NAME: ${reportObject.os.serverName}
ENVIRONMENT: ${reportObject.api.environment}
UNRAID_VERSION: ${reportObject.os.version}
UNRAID_API_VERSION: ${reportObject.api.version}
UNRAID_API_STATUS: ${reportObject.api.status}
API_KEY: ${reportObject.apiKey}
MY_SERVERS: ${reportObject.myServers.status}${
                reportObject.myServers.myServersUsername
                    ? `\nMY_SERVERS_USERNAME: ${reportObject.myServers.myServersUsername}`
                    : ''
            }
CLOUD: ${getReadableCloudDetails(reportObject, v)}
MINI-GRAPH: ${getReadableMinigraphDetails(
                reportObject
            )}${getReadableServerDetails(
                reportObject,
                v
            )}${getReadableAllowedOrigins(reportObject)}
</----UNRAID-API-REPORT----->
`;

            stdout.write(report);
            stdoutLogger.close();
            return report;
        }
    } catch (error: unknown) {
        console.log({ error });
        if (error instanceof Error) {
            cliLogger.trace(error);
            stdoutLogger.write(
                `\nFailed generating report with "${error.message}"\n`
            );
            return;
        }

        stdout.write(`${error as string}`);
        stdoutLogger.close();
    }
};
