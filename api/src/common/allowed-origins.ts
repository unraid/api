import { getters, type RootState, store } from '@app/store';
import { uniq } from 'lodash';
import { getPortAndDefaultUrl, getServerIps } from '../graphql/resolvers/subscription/network';

const getAllowedSocks = (): string[] => [
	// Notifier bridge
	'/var/run/unraid-notifications.sock',

	// Unraid PHP scripts
	'/var/run/unraid-php.sock',

	// CLI
	'/var/run/unraid-cli.sock',
];

const getLocalAccessUrlsForServer = (state: RootState = store.getState()): string[] => {
	const { nginx } = state.emhttp;
	if (!nginx || Object.keys(nginx).length === 0) {
		// We haven't loaded nginx yet
		return [];
	}

	const ports = getPortAndDefaultUrl(nginx);
	return [
		new URL(`http://localhost${ports.port}`).toString(),
		new URL(`https://localhost${ports.portSsl}`).toString(),
	];
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

export const getAllowedOrigins = (state: RootState = store.getState()): string[] => uniq([
	...getAllowedSocks(),
	...getLocalAccessUrlsForServer(),
	...getRemoteAccessUrlsForAllowedOrigins(state),
	...getExtraOrigins(),
]).map(url => url.endsWith('/') ? url.slice(0, -1) : url);
