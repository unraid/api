import { uniq } from 'lodash-es';

import type { RootState } from '@app/store/index.js';
import { logger } from '@app/core/log.js';
import { GRAPHQL_INTROSPECTION } from '@app/environment.js';
import { getServerIps, getUrlForField } from '@app/graphql/resolvers/subscription/network.js';
import { getters, store } from '@app/store/index.js';
import { FileLoadStatus } from '@app/store/types.js';

const getAllowedSocks = (): string[] => [
    // Notifier bridge
    '/var/run/unraid-notifications.sock',

    // Unraid PHP scripts
    '/var/run/unraid-php.sock',

    // CLI
    '/var/run/unraid-cli.sock',
];

const getLocalAccessUrlsForServer = (state: RootState = store.getState()): string[] => {
    const { emhttp } = state;

    if (emhttp.status !== FileLoadStatus.LOADED) {
        return [];
    }

    const { nginx } = emhttp;
    try {
        return [
            getUrlForField({
                url: 'localhost',
                port: nginx.httpPort,
            }).toString(),
            getUrlForField({
                url: 'localhost',
                portSsl: nginx.httpsPort,
            }).toString(),
        ];
    } catch (error: unknown) {
        logger.debug('Caught error in getLocalAccessUrlsForServer: \n%o', error);
        return [];
    }
};

const getRemoteAccessUrlsForAllowedOrigins = (state: RootState = store.getState()): string[] => {
    const { urls } = getServerIps(state);

    if (urls) {
        return urls.reduce<string[]>((acc, curr) => {
            if ((curr.ipv4 && curr.ipv6) || curr.ipv4) {
                acc.push(curr.ipv4.toString());
            } else if (curr.ipv6) {
                acc.push(curr.ipv6.toString());
            }

            return acc;
        }, []);
    }

    return [];
};

export const getExtraOrigins = (): string[] => {
    const { extraOrigins } = getters.config().api;
    if (extraOrigins) {
        return extraOrigins
            .replaceAll(' ', '')
            .split(',')
            .filter((origin) => origin.startsWith('http://') || origin.startsWith('https://'));
    }

    return [];
};

const getConnectOrigins = (): string[] => {
    const connectMain = 'https://connect.myunraid.net';
    const connectStaging = 'https://connect-staging.myunraid.net';
    const connectDev = 'https://dev-my.myunraid.net:4000';

    return [connectMain, connectStaging, connectDev];
};

const getApolloSandbox = (): string[] => {
    if (GRAPHQL_INTROSPECTION) {
        return ['https://studio.apollographql.com'];
    }
    return [];
};

export const getAllowedOrigins = (state: RootState = store.getState()): string[] =>
    uniq([
        ...getAllowedSocks(),
        ...getLocalAccessUrlsForServer(state),
        ...getRemoteAccessUrlsForAllowedOrigins(state),
        ...getExtraOrigins(),
        ...getConnectOrigins(),
        ...getApolloSandbox(),
    ]).map((url) => (url.endsWith('/') ? url.slice(0, -1) : url));
