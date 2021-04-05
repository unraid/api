import { MOTHERSHIP_GRAPHQL_LINK, MOTHERSHIP_RELAY_WS_LINK, ONE_MINUTE } from '../../consts';
import { relayLogger, apiManager, pubsub } from '../../core';
import { isNodeError, sleep } from '../../core/utils';
import { varState } from '../../core/states';
import { subscribeToServers } from '../subscribe-to-servers';
import { AppError } from '../../core/errors';
import { readFileIfExists } from '../utils';
import { CustomSocket, WebSocketWithHeartBeat } from '../custom-socket';
import packageJson from '../../../package.json';
import { sockets } from '../../sockets';
import { userCache, CachedServers } from '../../cache';
import originalFetch from 'node-fetch';
import fetchRetry from 'fetch-retry';

const fetch = fetchRetry(originalFetch as any, {
	retries: 5,
	retryOn: [429],
	retryDelay: function (attempt: number, _error, _response) {
		// Apply random jitter to the reconnection delay
		return Math.floor(Math.random() * (2500 * attempt));
	}
}) as unknown as typeof originalFetch;

export class MothershipSocket extends CustomSocket {
	private mothershipServersEndpoint?: {
		unsubscribe: () => void;
	};

	constructor(options: CustomSocket['options'] = {}) {
		super({
			name: 'Mothership',
			uri: MOTHERSHIP_RELAY_WS_LINK,
			logger: relayLogger,
			lazy: false,
			...options
		});
	}

	onConnect() {
		const connectToMothershipsGraphql = this.connectToMothershipsGraphql.bind(this);
		const queryMothershipsGraphql = this.queryMothershipsGraphql.bind(this);
		const onConnect = super.onConnect.bind(this);
		return async function (this: WebSocketWithHeartBeat) {
			try {
				// Run super
				await onConnect().bind(this)();

				// Query /servers on mothership
				await queryMothershipsGraphql();

				// Sub to /servers on mothership
				await connectToMothershipsGraphql();
			} catch (error: unknown) {
				if (isNodeError(error, AppError)) {
					const code = (error.code) ?? 500;
					this.close(`${code}`.length === 4 ? Number(code) : Number(`4${code}`), 'INTERNAL_SERVER_ERROR');
				}
			}
		};
	}

	onDisconnect() {
		const onDisconnect = super.onDisconnect().bind(this as unknown as WebSocketWithHeartBeat);
		return async (code: number, message: string) => {
			try {
				// Close connection to motherships's server's endpoint
				await this.disconnectFromMothershipsGraphql();

				// Close connection to internal graphql
				const internalGraphqlClient = sockets.get('internalGraphql');
				await internalGraphqlClient?.disconnect();

				// Process disconnection
				await onDisconnect(code, message);
			} catch (error: unknown) {
				if (isNodeError(error, AppError)) {
					this.logger.debug('Connection closed with code=%s reason="%s"', code, error.message);
				}
			}
		};
	}

	// When we get a message from relay send it through to our local graphql instance
	onMessage() {
		const sendMessage = this.sendMessage.bind(this);
		return async (data: string) => {
			try {
				this.logger.silly('Recieved message from mothership\'s relay, forwarding to the internal graphql connection');
				await sendMessage('internalGraphql', data);
				this.logger.silly('Message sent to the internal graphql connection successfully.');
			} catch (error: unknown) {
				if (isNodeError(error, AppError)) {
					// Something weird happened while processing the message
					// This is likely a malformed message
					this.logger.error('Failed sending message to relay.', error);
				}
			}
		};
	}

	onError() {
		const logger = this.logger;
		return async function (this: WebSocketWithHeartBeat, error: NodeJS.ErrnoException) {
			try {
				logger.error(error);

				// The relay is down
				if (error.message.includes('502')) {
					// Sleep for 30 seconds
					await sleep(ONE_MINUTE / 2);
				}

				// Connection refused, aka couldn't connect
				// This is usually because the address is wrong or offline
				if (error.code === 'ECONNREFUSED') {
					// @ts-expect-error
					logger.debug('Couldn\'t connect to %s:%s', error.address, error.port);
					return;
				}

				// Closed before connection started
				if (error.message.toString().includes('WebSocket was closed before the connection was established')) {
					logger.debug(error.message);
					return;
				}

				throw error;
			} catch {
				// Unknown error
				logger.error('socket error', error);
			} finally {
				// Kick the connection
				this.close(4408, 'REQUEST_TIMEOUT');
			}
		};
	}

	protected async getApiKey() {
		const key = apiManager.getKey('my_servers');
		if (!key) {
			throw new AppError('No API key found.');
		}

		return key.key;
	}

	protected async getHeaders() {
		const apiKey = apiManager.getKey('my_servers')?.key!;
		const regFile = await readFileIfExists(varState.data?.regFile);
		const keyFile = varState.data?.regFile ? regFile.toString('base64') : '';
		const serverName = `${varState.data.name}`;

		return {
			'x-api-key': apiKey,
			'x-flash-guid': varState.data?.flashGuid ?? '',
			'x-key-file': keyFile ?? '',
			'x-server-name': serverName,
			'x-unraid-api-version': packageJson.version
		};
	}

	private async queryMothershipsGraphql() {
		const response = await fetch(MOTHERSHIP_GRAPHQL_LINK, {
			method: 'POST',
			body: JSON.stringify({
				operationName: 'getServers',
				variables: {
					apiKey: this.apiKey
				},
				query: 'query getServers($apiKey: String!) {\n  servers @auth(apiKey: $apiKey) {\n    owner {\n      username\n      url\n      avatar\n    }\n    guid\n    apikey\n    name\n    status\n    wanip\n    lanip\n    localurl\n    remoteurl\n  }\n}\n'
			})
		});

		// Failed getting servers
		if (response.status !== 200) {
			return;
		}

		// Get servers
		const data = response.json() as any;

		// Update internal cache
		userCache.set<CachedServers>('mine', {
			servers: data.servers
		});

		// Update subscribers
		await pubsub.publish('servers', {
			servers: data.servers
		});
	}

	private async connectToMothershipsGraphql() {
		this.mothershipServersEndpoint = await subscribeToServers(this.apiKey);
	}

	private async disconnectFromMothershipsGraphql() {
		this.mothershipServersEndpoint?.unsubscribe();
	}
}
