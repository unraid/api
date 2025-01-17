import { ApolloClient, ApolloQueryResult, NormalizedCacheObject } from '@apollo/client/core/index.js';
import ipRegex from 'ip-regex';
import { Command, CommandRunner, Option } from 'nest-commander';

import { isUnraidApiRunning } from '@app/core/utils/pm2/unraid-api-running';
import { API_VERSION } from '@app/environment';
import { MinigraphStatus } from '@app/graphql/generated/api/types';
import { getters, store } from '@app/store';
import { loadConfigFile } from '@app/store/modules/config';
import { loadStateFiles } from '@app/store/modules/emhttp';
import { LogService } from '@app/unraid-api/cli/log.service';

import type { getCloudQuery, getServersQuery } from '../../graphql/generated/api/operations';
import { getApiApolloClient } from '../../graphql/client/api/get-api-client';
import { getCloudDocument, getServersDocument } from '../../graphql/generated/api/operations';

type CloudQueryResult = NonNullable<ApolloQueryResult<getCloudQuery>['data']['cloud']>;
type ServersQueryResultServer = NonNullable<ApolloQueryResult<getServersQuery>['data']['servers']>[0];

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
    const cloud = await client.query({ query: getCloudDocument });
    return cloud.data.cloud ?? null;
};

export const getServersData = async ({
    client,
    v,
}: {
    client: ApolloClient<NormalizedCacheObject>;
    v: number;
}): Promise<ServersPayload | null> => {
    if (v === 0) {
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
        return {
            online: [],
            offline: [],
            invalid: [],
        };
    }
};

const hashUrlRegex = () => /(.*)([a-z0-9]{40})(.*)/g;

export const anonymiseOrigins = (origins?: string[]): string[] => {
    const originsWithoutSocks = origins?.filter((url) => !url.endsWith('.sock')) ?? [];
    return originsWithoutSocks
        .map((origin) =>
            origin
                // Replace 40 char hash string with "HASH"
                .replace(hashUrlRegex(), '$1HASH$3')
                // Replace ipv4 address using . separator with "IPV4ADDRESS"
                .replace(ipRegex(), 'IPV4ADDRESS')
                // Replace ipv4 address using - separator with "IPV4ADDRESS"
                .replace(new RegExp(ipRegex().toString().replace('\\.', '-')), '/IPV4ADDRESS')
                // Report WAN port
                .replace(`:${getters.config().remote.wanport || 443}`, ':WANPORT')
        )
        .filter(Boolean);
};

const getAllowedOrigins = (cloud: CloudQueryResult | null, v: number): string[] | null => {
    if (v > 1) {
        return cloud?.allowedOrigins.filter((url) => !url.endsWith('.sock')) ?? [];
    } else if (v === 1) {
        return anonymiseOrigins(cloud?.allowedOrigins ?? []);
    }
    return null;
};

const getReadableCloudDetails = (reportObject: ReportObject, v: number): string => {
    const error = reportObject.cloud.error ? `\n	ERROR [${reportObject.cloud.error}]` : '';
    const status = reportObject.cloud.status ? reportObject.cloud.status : 'disconnected';
    const ip = reportObject.cloud.ip && v !== 0 ? `\n	IP: [${reportObject.cloud.ip}]` : '';
    return `
	STATUS: [${status}] ${ip} ${error}`;
};

const getReadableMinigraphDetails = (reportObject: ReportObject): string => {
    const statusLine = `STATUS: [${reportObject.minigraph.status}]`;
    const errorLine = reportObject.minigraph.error ? `	ERROR: [${reportObject.minigraph.error}]` : null;
    const timeoutLine = reportObject.minigraph.timeout
        ? `	TIMEOUT: [${(reportObject.minigraph.timeout || 1) / 1_000}s]`
        : null; // 1 in case of divide by zero

    return `
	${statusLine}${errorLine ? `\n${errorLine}` : ''}${timeoutLine ? `\n${timeoutLine}` : ''}`;
};

// Convert server to string output
const serverToString = (v: number) => (server: ServersQueryResultServer) =>
    `${server?.name ?? 'No Server Name'}${
        v > 0
            ? `[owner="${server.owner?.username ?? 'No Owner Found'}"${
                  v > 1 ? ` guid="${server.guid ?? 'No GUID'}"]` : ']'
              }`
            : ''
    }`;

const getReadableServerDetails = (reportObject: ReportObject, v: number): string => {
    if (!reportObject.servers) {
        return '';
    }

    if (reportObject.api.status === 'stopped') {
        return '\nSERVERS: API is offline';
    }

    const invalid =
        v > 0 && reportObject.servers.invalid.length > 0
            ? `
	INVALID: ${reportObject.servers.invalid.map(serverToString(v)).join(',')}`
            : '';

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

interface ReportOptions {
    raw: boolean;
    json: boolean;
    verbose: number;
}

@Command({ name: 'report' })
export class ReportCommand extends CommandRunner {
    constructor(private readonly logger: LogService) {
        super();
    }

    @Option({
        flags: '-r, --raw',
        description: 'whether to enable raw command output',
    })
    parseRaw(): boolean {
        return true;
    }

    @Option({
        flags: '-j, --json',
        description: 'Display JSON output for this command',
    })
    parseJson(): boolean {
        return true;
    }

    @Option({
        flags: '-v, --verbose',
        description: 'Verbosity level (-v -vv -vvv)',
    })
    handleVerbose(value: string | boolean, previous: number): number {
        if (typeof value === 'boolean') {
            // Single `-v` or `--verbose` flag increments verbosity
            return (previous ?? 0) + 1;
        } else if (value === undefined) {
            return (previous ?? 0) + 1; // Increment if flag is used without value
        } else {
            // If `-vvv` is passed as one flag, count the number of `v`s
            return (previous ?? 0) + value.length;
        }
    }

    async report(options?: ReportOptions): Promise<string | ReportObject | void> {
        const rawOutput = options?.raw ?? false;

        // Check if we have a tty attached to stdout
        // If we don't then this is being piped to a log file, etc.
        const hasTty = process.stdout.isTTY;

        // Check if we should show interactive logs
        // If this has a tty it's interactive
        // AND
        // If they don't have --raw
        const isInteractive = hasTty && !rawOutput;

        try {
            // Show loading message
            if (isInteractive) {
                this.logger.info('Generating report please wait…');
            }

            const jsonReport = options?.json ?? false;
            const v = options?.verbose ?? 0;

            // Find all processes called "unraid-api" which aren't this process
            const unraidApiRunning = await isUnraidApiRunning();

            // Load my servers config file into store
            await store.dispatch(loadConfigFile());
            await store.dispatch(loadStateFiles());

            const { config, emhttp } = store.getState();
            if (!config.upc.apikey) throw new Error('Missing UPC API key');

            const client = getApiApolloClient({ localApiKey: config.remote.localApiKey || '' });
            // Fetch the cloud endpoint
            const cloud = await getCloudData(client)
                .then((data) => {
                    this.logger.debug('Cloud Data', data);
                    return data;
                })
                .catch((error) => {
                    this.logger.debug(
                        'Failed fetching cloud from local graphql with "%s"',
                        error instanceof Error ? error.message : 'Unknown Error'
                    );
                    return null;
                });

            // Query local graphql using upc's API key
            // Get the servers array
            const servers = await getServersData({ client, v });

            // Check if the API key is valid
            const isApiKeyValid = cloud?.apiKey.valid ?? false;

            const reportObject: ReportObject = {
                os: {
                    serverName: emhttp.var.name,
                    version: emhttp.var.version,
                },
                api: {
                    version: API_VERSION,
                    status: unraidApiRunning ? 'running' : 'stopped',
                    environment: process.env.ENVIRONMENT ?? 'THIS_WILL_BE_REPLACED_WHEN_BUILT',
                    nodeVersion: process.version,
                },
                apiKey: isApiKeyValid ? 'valid' : (cloud?.apiKey.error ?? 'invalid'),
                ...(servers ? { servers } : {}),
                myServers: {
                    status: config?.remote?.username ? 'authenticated' : 'signed out',
                    ...(config?.remote?.username
                        ? {
                              myServersUsername: config?.remote?.username?.includes('@')
                                  ? 'REDACTED'
                                  : config?.remote.username,
                          }
                        : {}),
                },
                minigraph: {
                    status: cloud?.minigraphql.status ?? MinigraphStatus.PRE_INIT,
                    timeout: cloud?.minigraphql.timeout ?? null,
                    error:
                        (cloud?.minigraphql.error ?? !cloud?.minigraphql.status)
                            ? 'API Disconnected'
                            : null,
                },
                cloud: {
                    status: cloud?.cloud.status ?? 'error',
                    ...(cloud?.cloud.error ? { error: cloud.cloud.error } : {}),
                    ...(cloud?.cloud.status === 'ok' ? { ip: cloud.cloud.ip ?? 'NO_IP' } : {}),
                    ...(getAllowedOrigins(cloud, v)
                        ? { allowedOrigins: getAllowedOrigins(cloud, v) }
                        : {}),
                },
            };

            if (jsonReport) {
                this.logger.clear();
                this.logger.info(JSON.stringify(reportObject) + '\n');
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
MINI-GRAPH: ${getReadableMinigraphDetails(reportObject)}${getReadableServerDetails(
                    reportObject,
                    v
                )}${getReadableAllowedOrigins(reportObject)}
</----UNRAID-API-REPORT----->
`;
                this.logger.clear();

                this.logger.info(report);
                return report;
            }
        } catch (error: unknown) {
            console.log({ error });
            if (error instanceof Error) {
                this.logger.debug(error);
                this.logger.error(`\nFailed generating report with "${error.message}"\n`);
                return;
            }
        }
    }

    async run(_: string[], options?: ReportOptions): Promise<void> {
        await this.report(options);
    }
}
