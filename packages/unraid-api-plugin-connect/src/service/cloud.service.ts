import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { lookup as lookupDNS, resolve as resolveDNS } from 'node:dns';
import { promisify } from 'node:util';

import { got, HTTPError, TimeoutError } from 'got';
import ip from 'ip';
import NodeCache from 'node-cache';

import { ConfigType, MinigraphStatus } from '../model/connect-config.model.js';
import { ConnectConfigService } from './connect-config.service.js';
import { ONE_HOUR_SECS, ONE_MINUTE_SECS } from '../helper/generic-consts.js';
import { CloudResponse, MinigraphqlResponse } from '../model/cloud.model.js';
import { MothershipConnectionService } from './connection.service.js';

interface CacheSchema {
    cloudIp: string;
    dnsError: Error;
    cloudCheck: CloudResponse;
}

/** Type-helper that keeps all NodeCache methods except get/set signatures */
type TypedCache<S> = Omit<NodeCache, 'set' | 'get'> & {
    set<K extends keyof S>(key: K, value: S[K], ttl?: number): boolean;
    get<K extends keyof S>(key: K): S[K] | undefined;
};

const createGotOptions = (apiVersion: string, apiKey: string) => ({
    timeout: {
        request: 5_000,
    },
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'x-unraid-api-version': apiVersion,
        'x-api-key': apiKey,
    },
});
const isHttpError = (error: unknown): error is HTTPError => error instanceof HTTPError;

@Injectable()
export class CloudService {
    static cache = new NodeCache() as TypedCache<CacheSchema>;

    private readonly logger = new Logger(CloudService.name);
    constructor(
        private readonly configService: ConfigService<ConfigType>,
        private readonly mothership: MothershipConnectionService,
        private readonly connectConfig: ConnectConfigService
    ) {}

    checkMothershipClient(): MinigraphqlResponse {
        this.logger.verbose('checking mini-graphql');
        const connection = this.mothership.getConnectionState();
        if (!connection) {
            return { status: MinigraphStatus.PING_FAILURE, error: 'No connection to mothership' };
        }

        let timeoutRemaining: number | null = null;
        const { status, error, timeout, timeoutStart } = connection;
        if (timeout && timeoutStart) {
            const elapsed = Date.now() - timeoutStart;
            timeoutRemaining = timeout - elapsed;
        }
        return { status, error, timeout: timeoutRemaining };
    }

    async checkCloudConnection() {
        this.logger.verbose('checking cloud connection');
        const gqlClientStatus = this.mothership.getConnectionState()?.status;
        if (gqlClientStatus === MinigraphStatus.CONNECTED) {
            return await this.fastCheckCloud();
        }
        const apiKey = this.connectConfig.getConfig().apikey;
        const cachedCloudCheck = CloudService.cache.get('cloudCheck');
        if (cachedCloudCheck) {
            // this.logger.verbose('Cache hit for cloud check %O', cachedCloudCheck);
            return cachedCloudCheck;
        }
        this.logger.verbose('Cache miss for cloud check');

        const apiVersion = this.configService.getOrThrow<string>('API_VERSION');
        const cloudCheck = await this.hardCheckCloud(apiVersion, apiKey);
        const ttl = cloudCheck.error ? 15 * ONE_MINUTE_SECS : 4 * ONE_HOUR_SECS; // 15 minutes for a failure, 4 hours for a success
        CloudService.cache.set('cloudCheck', cloudCheck, ttl);
        return cloudCheck;
    }

    private async hardCheckCloud(apiVersion: string, apiKey: string): Promise<CloudResponse> {
        try {
            const mothershipGqlUri = this.configService.getOrThrow<string>('MOTHERSHIP_GRAPHQL_LINK');
            const ip = await this.checkDns();
            const { canReach, baseUrl } = await this.canReachMothership(
                mothershipGqlUri,
                apiVersion,
                apiKey
            );
            if (!canReach) {
                return { status: 'error', error: `Unable to connect to mothership at ${baseUrl}` };
            }
            await this.checkMothershipAuthentication(mothershipGqlUri, apiVersion, apiKey);
            return { status: 'ok', error: null, ip };
        } catch (error) {
            return { status: 'error', error: error instanceof Error ? error.message : 'Unknown Error' };
        }
    }

    private async canReachMothership(mothershipGqlUri: string, apiVersion: string, apiKey: string) {
        const mothershipBaseUrl = new URL(mothershipGqlUri).origin;
        /**
         * This is mainly testing the user's network config
         * If they cannot resolve this they may have it blocked or have a routing issue
         */
        const canReach = await got
            .head(mothershipBaseUrl, createGotOptions(apiVersion, apiKey))
            .then(() => true)
            .catch(() => false);
        return { canReach, baseUrl: mothershipBaseUrl };
    }

    private async checkMothershipAuthentication(
        mothershipGqlUri: string,
        apiVersion: string,
        apiKey: string
    ) {
        const msURL = new URL(mothershipGqlUri);
        const url = `https://${msURL.hostname}${msURL.pathname}`;

        try {
            const options = createGotOptions(apiVersion, apiKey);

            // This will throw if there is a non 2XX/3XX code
            await got.head(url, options);
        } catch (error: unknown) {
            // HTTP errors
            if (isHttpError(error)) {
                switch (error.response.statusCode) {
                    case 429: {
                        const retryAfter = error.response.headers['retry-after'];
                        throw new Error(
                            retryAfter
                                ? `${url} is rate limited for another ${retryAfter} seconds`
                                : `${url} is rate limited`
                        );
                    }

                    case 401:
                        throw new Error('Invalid credentials');
                    default:
                        throw new Error(
                            `Failed to connect to ${url} with a "${error.response.statusCode}" HTTP error.`
                        );
                }
            }

            if (error instanceof TimeoutError) throw new Error(`Timed-out while connecting to "${url}"`);
            this.logger.debug('Unknown Error', error);
            // @TODO: Add in the cause when we move to a newer node version
            // throw new Error('Unknown Error', { cause: error as Error });
            throw new Error('Unknown Error');
        }
    }

    private async fastCheckCloud(): Promise<CloudResponse> {
        let ip = 'FAST_CHECK_NO_IP_FOUND';
        try {
            ip = await this.checkDns();
        } catch (error) {
            this.logger.warn('Failed to fetch DNS, but Minigraph is connected - continuing');
            ip = `ERROR: ${error instanceof Error ? error.message : 'Unknown Error'}`;
            // Clear error since we're actually connected to the cloud.
            // Do not populate the ip cache since we're in a weird state (this is a change from the previous behavior).
            CloudService.cache.del('dnsError');
        }
        return { status: 'ok', error: null, ip };
    }

    private async checkDns(): Promise<string> {
        const cache = CloudService.cache;
        const cloudIp = cache.get('cloudIp');
        if (cloudIp) return cloudIp;

        const dnsError = cache.get('dnsError');
        if (dnsError) throw dnsError;

        try {
            const { local, network } = await this.hardCheckDns();
            const validIp = local ?? network ?? '';
            if (typeof validIp !== 'string') {
                return '';
            }
            cache.set('cloudIp', validIp, 12 * ONE_HOUR_SECS); // 12 hours ttl
            return validIp;
        } catch (error) {
            cache.set('dnsError', error as Error, 15 * ONE_MINUTE_SECS); // 15 minutes ttl
            cache.del('cloudIp');
            throw error;
        }
    }

    private async hardCheckDns() {
        const mothershipGqlUri = this.configService.getOrThrow<string>('MOTHERSHIP_GRAPHQL_LINK');
        const hostname = new URL(mothershipGqlUri).host;
        const lookup = promisify(lookupDNS);
        const resolve = promisify(resolveDNS);
        const [local, network] = await Promise.all([
            lookup(hostname).then(({ address }) => address),
            resolve(hostname).then(([address]) => address),
        ]);

        if (!local.includes(network)) {
            // Question: should we actually throw an error, or just log a warning?
            //
            // This is usually due to cloudflare's load balancing.
            // if `dig +short mothership.unraid.net` shows both IPs, then this should be safe to ignore.
            // this.logger.warn(
            //     `Local and network resolvers showing different IP for "${hostname}". [local="${
            //         local ?? 'NOT FOUND'
            //     }"] [network="${network ?? 'NOT FOUND'}"].`
            // );

            throw new Error(
                `Local and network resolvers showing different IP for "${hostname}". [local="${
                    local ?? 'NOT FOUND'
                }"] [network="${network ?? 'NOT FOUND'}"]`
            );
        }

        // The user likely has a PI-hole or something similar running.
        if (ip.isPrivate(local))
            throw new Error(
                `"${hostname}" is being resolved to a private IP. [IP=${local ?? 'NOT FOUND'}]`
            );

        return { local, network };
    }
}
