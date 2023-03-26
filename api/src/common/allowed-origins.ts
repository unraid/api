import { getters, type RootState, store } from '@app/store';
import { uniq } from 'lodash';
import { getServerIps, getUrlForField } from '@app/graphql/resolvers/subscription/network';
import { FileLoadStatus } from '@app/store/types';
import { logger } from '../core';

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
			getUrlForField({ url: 'localhost', port: nginx.httpPort }).toString(),
			getUrlForField({ url: 'localhost', portSsl: nginx.httpsPort }).toString(),
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
			if (curr.ipv4 && curr.ipv6) {
				acc.push(curr.ipv4.toString());
			} else if (curr.ipv4) {
				acc.push(curr.ipv4.toString());
			} else if (curr.ipv6) {
				acc.push(curr.ipv6.toString());
			}

			return acc;
		}, []);
	}

	return [];
};

const getExtraOrigins = (): string[] => {
	const { extraOrigins } = getters.config().api;
	if (extraOrigins) {
		return extraOrigins.split(', ').filter(origin => origin.startsWith('http://') || origin.startsWith('https://'));
	}

	return [];
};

const getConnectOrigins = () : string[] => {
	const connectMain = 'https://connect.myunraid.net';
	const connectStaging = 'https://staging.connect.myunraid.net';
	const connectDev = 'https://dev-my.myunraid.net:4000';

	return [
		connectMain,
		connectStaging,
		connectDev
	]
}

export const getAllowedOrigins = (state: RootState = store.getState()): string[] => uniq([
	...getAllowedSocks(),
	...getLocalAccessUrlsForServer(),
	...getRemoteAccessUrlsForAllowedOrigins(state),
	...getExtraOrigins(),
	...getConnectOrigins()
	
]).map(url => url.endsWith('/') ? url.slice(0, -1) : url);
