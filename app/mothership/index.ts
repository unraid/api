import fs from 'fs';
import GracefulWebSocket from 'graceful-ws';
import { Serializer as IniSerializer } from 'multi-ini';
import { INTERNAL_WS_LINK, MOTHERSHIP_RELAY_WS_LINK } from '../consts';
import { apiManager } from '../core/api-manager';
import { log } from '../core/log';
import { varState } from '../core/states/var';
import packageJson from '../../package.json';
import { paths } from '../core/paths';
import { loadState } from '../core/utils/misc/load-state';
import { subscribeToServers } from './subscribe-to-servers';

export const sockets = {
	internal: null as GracefulWebSocket | null,
	relay: null as GracefulWebSocket | null
};
let internalOpen = false;
let relayOpen = false;
let isLocalConnecting = false;
let isRelayConnecting = false;

export const startInternal = (apiKey: string) => {
	// Another process has already kicked this off
	if (isLocalConnecting) {
		return;
	}

	// Start the connection
	isLocalConnecting = true;
	log.debug('⌨️ INTERNAL:CONNECTING');
	sockets.internal = new GracefulWebSocket(INTERNAL_WS_LINK, ['graphql-ws'], {
		headers: {
			'x-api-key': apiKey
		}
	});

	sockets.internal.on('connected', () => {
		log.debug('⌨️ INTERNAL:CONNECTED');
		isLocalConnecting = false;
		internalOpen = true;
		sockets.internal?.send(JSON.stringify({
			type: 'connection_init',
			payload: {
				'x-api-key': apiKey
			}
		}));

		// Internal is ready at this point
		startRelay();
		subscribeToServers(apiKey);
	});

	sockets.internal.on('disconnected', () => {
		log.debug('⌨️ INTERNAL:DISCONNECTED');
		isLocalConnecting = false;
		internalOpen = false;
	});

	sockets.internal.on('killed', () => {
		isLocalConnecting = false;
		internalOpen = false;
		log.debug('☁️ INTERNAL:KILLED');
	});

	sockets.internal.on('message', e => {
		// Skip auth acknowledgement
		if (e.data === '{"type":"connection_ack"}') {
			return;
		}

		// Skip keep-alive if relay is down
		if (e.data === '{"type":"ka"}' && (!sockets.relay || sockets.relay.readyState === 0)) {
			return;
		}

		if (relayOpen) {
			sockets.relay?.send(e.data);
		}
	});

	sockets.internal?.on('error', error => {
		console.log('⌨️ INTERNAL:ERROR', error);
	});
};

const getRelayHeaders = () => {
	const apiKey = apiManager.getKey('my_servers')?.key!;
	const serverName = `${varState.data.name}`;

	return {
		'x-api-key': apiKey,
		'x-flash-guid': varState.data?.flashGuid ?? '',
		'x-server-name': serverName,
		'x-unraid-api-version': packageJson.version
	};
};

// Get my server's config file path
const configPath = paths.get('myservers-config')!;

// Ini serializer
const serializer = new IniSerializer({
	// This ensures it ADDs quotes
	keep_quotes: false
});

export const startRelay = () => {
	// Another process has already kicked this off
	if (isRelayConnecting) {
		return;
	}

	// Start the connection
	isRelayConnecting = true;
	log.debug('☁️ RELAY:CONNECTING');
	sockets.relay = new GracefulWebSocket(MOTHERSHIP_RELAY_WS_LINK, ['graphql-ws'], {
		headers: getRelayHeaders()
	});

	// Connection-state related events
	sockets.relay.on('connected', () => {
		isRelayConnecting = false;
		relayOpen = true;
		log.debug('☁️ RELAY:CONNECTED');
	});

	sockets.relay.on('disconnected', () => {
		log.debug('☁️ RELAY:DISCONNECTED');
		isRelayConnecting = false;
		relayOpen = false;
		sockets.internal?.close();
		sockets.internal?.start();
	});

	sockets.relay.on('killed', () => {
		isRelayConnecting = false;
		log.debug('☁️ RELAY:KILLED');
	});

	sockets.relay.on('error', () => {
		log.debug('☁️ RELAY:ERROR');
	});

	// Message event
	sockets.relay.on('message', e => {
		if (internalOpen) {
			sockets.internal?.send(e.data);
		}
	});

	sockets.relay.on('unexpected-response', (code: number, message: string) => {
		log.debug('☁️ RELAY:UNEXPECTED_RESPONSE:%s %s', code, message);
		const allowRetry = !isRelayConnecting;

		switch (code) {
			case 401:
				log.debug('☁️ RELAY:INVALID_API_KEY');

				// Delete the my_servers API key from the cfg
				{
					const myserversConfigFile = loadState<{
						remote: { apikey?: string };
					}>(configPath);

					delete myserversConfigFile.remote.apikey;

					log.debug('Dumping MyServers config back to file');

					// Stringify data
					const stringifiedData = serializer.serialize(myserversConfigFile);

					// Update config file
					fs.writeFileSync(configPath, stringifiedData);
				}

				// Wait for a new one.
				// Once it's up it'll restart the connection.
				break;

			case 426:
				log.debug('☁️ RELAY:API_IS_TOO_OUTDATED');

				// Bail as we cannot reconnect
				break;

			case 429:
				log.debug(`☁️ RELAY:${message ?? 'API_KEY_IN_USE'}:RECONNECTING:30_000`);

				// Retry in 30s
				setTimeout(() => {
					// Another process has already kicked this off
					if (!allowRetry) {
						log.debug('☁️ RELAY:ALLOW_RETRY:false');
						return;
					}

					// Restart relay connection
					isRelayConnecting = true;
					log.debug(`☁️ RELAY:${message ?? 'API_KEY_IN_USE'}:RECONNECTING:NOW`);
					sockets.relay?.start();
				}, 30_000);

				break;

			case 500:
				log.debug(`☁️ RELAY:${message ?? 'INTERNAL_SERVER_ERROR'}:RECONNECTING:60_000`);

				// Retry in 60s
				setTimeout(() => {
					// Another process has already kicked this off
					if (!allowRetry) {
						log.debug('☁️ RELAY:ALLOW_RETRY:false');
						return;
					}

					// Restart relay connection
					isRelayConnecting = true;
					log.debug(`☁️ RELAY:${message ?? 'INTERNAL_SERVER_ERROR'}:RECONNECTING:NOW`);
					sockets.relay?.start();
				}, 60_000);

				break;

			case 503:
				log.debug(`☁️ RELAY:${message ?? 'GATEWAY_DOWN'}:RECONNECTING:60_000`);

				// Retry in 60s
				setTimeout(() => {
					// Another process has already kicked this off
					if (!allowRetry) {
						log.debug('☁️ RELAY:ALLOW_RETRY:false');
						return;
					}

					// Restart relay connection
					isRelayConnecting = true;
					log.debug(`☁️ RELAY:${message ?? 'GATEWAY_DOWN'}:RECONNECTING:NOW`);
					sockets.relay?.start();
				}, 60_000);

				break;

			default:
				// Another process has already kicked this off
				if (!allowRetry) {
					log.debug('☁️ RELAY:ALLOW_RETRY:false');
					return;
				}

				// Restart relay connection
				isRelayConnecting = true;
				log.debug(`☁️ RELAY:${message}:RECONNECTING:NOW`);
				sockets.relay?.start();
				break;
		}
	});
};
