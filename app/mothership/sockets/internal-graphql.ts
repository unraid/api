import { INTERNAL_WS_LINK } from '../../consts';
import { apiManager, relayLogger } from '../../core';
import { isNodeError, sleep } from '../../core/utils';
import { AppError } from '../../core/errors';
import { CustomSocket, WebSocketWithHeartBeat } from '../custom-socket';
import { MothershipSocket } from './mothership';

export class InternalGraphql extends CustomSocket {
	private readonly mothership?: MothershipSocket;

	constructor(options: CustomSocket['options'] = {}) {
		super({
			name: 'InternalGraphql',
			uri: INTERNAL_WS_LINK,
			logger: relayLogger,
			...options
		});
	}

	onMessage() {
		const mothership = this.mothership;
		return async function (this: WebSocketWithHeartBeat, data: string) {
			try {
				mothership?.connection?.send(data);
			} catch (error: unknown) {
				if (isNodeError(error, AppError)) {
					// Relay socket is closed, close internal one
					if (error.message.includes('WebSocket is not open')) {
						this.close(4200, JSON.stringify({
							message: error.message
						}));
					}
				}
			}
		};
	}

	onError() {
		const connect = this.connect.bind(this);
		const logger = this.logger;
		return async function (error: NodeJS.ErrnoException) {
			if (error.message === 'WebSocket was closed before the connection was established') {
				// Likely the internal relay-ws connection was started but then mothership
				// decided the key was invalid so it killed it
				// When this happens the relay-ws sometimes is still in the CONNECTING phase
				// This isn't an actual error so we skip it
				return;
			}

			// Socket was still offline try again?
			if (error.code && ['ENOENT', 'ECONNREFUSED'].includes(error.code)) {
				// Wait 1s
				await sleep(1000);

				// Re-connect to internal graphql server
				connect();
				return;
			}

			logger.error(error);
		};
	}

	onConnect() {
		const apiKey = this.apiKey;
		return async function (this: WebSocketWithHeartBeat) {
			// No API key, close internal connection
			if (!apiKey) {
				this.close(4200, JSON.stringify({
					message: 'No API key'
				}));
			}

			// Authenticate with ourselves
			this.send(JSON.stringify({
				type: 'connection_init',
				payload: {
					'x-api-key': apiKey
				}
			}));
		};
	}

	protected async getApiKey() {
		const key = apiManager.getKey('my_servers');
		if (!key) {
			throw new AppError('No API key found.');
		}

		return key.key;
	}
}
