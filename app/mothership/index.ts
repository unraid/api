import GracefulWebSocket from 'graceful-ws';
import { INTERNAL_WS_LINK, MOTHERSHIP_RELAY_WS_LINK } from '../consts';

let internal: GracefulWebSocket;
let relay: GracefulWebSocket;

let internalOpen = false;
let relayOpen = false;

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {};

const startInternal = (apiKey: string) => {
	internal = new GracefulWebSocket(INTERNAL_WS_LINK, ['graphql-ws'], {
		headers: {
			'x-api-key': apiKey,
		}
	});

	internal.on('connected', () => {
		internalOpen = true;
		internal.send(JSON.stringify({
			type: 'connection_init',
			payload: {
				'x-api-key': apiKey
			}
		}));

		// Internal is ready at this point
		if (!relay) {
			startRelay(apiKey);
		}
	});

	internal.on('disconnected', () => {
		internalOpen = false;
	});

	internal.on('message', e => {
		// Skip auth acknowledgement
		if (e.data === '{"type":"connection_ack"}') {
			return;
		}

		// Skip keep-alive if relay is down
		if (e.data === '{"type":"ka"}' && (!relay || relay.readyState === 0)) {
			return;
		}

		if (relayOpen) {
			relay.send(e.data);
		}
	});

	internal.on('error', error => {
		console.log('INTERNAL:ERROR', error);
	});
};

const startRelay = (apiKey: string) => {
	relay = new GracefulWebSocket(MOTHERSHIP_RELAY_WS_LINK, ['graphql-ws'], {
		headers: {
			'x-api-key': apiKey,
			'x-flash-guid': '0951-1666-3841-AF30A0001E64',
			'x-key-file': '',
			'x-server-name': 'mocked.tld',
			'x-unraid-api-version': '2.21.3'
		}
	});

	// Connection-state related events
	relay.on('connected', () => {
		relayOpen = true;
	});
	relay.on('disconnected', () => {
		relayOpen = false;
		// Close internal
		internal.close();
		// Start internal
		internal.start();
	});
	relay.on('killed', noop);
	relay.on('error', noop);

	// Message event
	relay.on('message', e => {
		if (internalOpen) {
			internal.send(e.data);
		}
	});

	relay.on('unexpected-response', (code, message) => {
		switch (code) {
			case 429:
				if (message === 'API_KEY_IN_USE') {
					setTimeout(() => {
						// Restart relay connection
						relay.start();
					}, 10_000);
				}

				break;

			default:
				// Restart relay connection
				relay.start();

				break;
		}
	});
};

// This starts it all
startInternal(API_KEY_HERE);
