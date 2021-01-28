import { MOTHERSHIP_RELAY_WS_LINK, ONE_MINUTE } from '../../consts';
import { mothershipLogger, apiManager } from '../../core';
import { getMachineId, sleep } from '../../core/utils';
import { varState, networkState } from '../../core/states';
import { subscribeToServers } from '../subscribe-to-servers';
import { AppError } from '../../core/errors';
import { readFileIfExists } from '../utils';
import { CustomSocket, WebSocketWithHeartBeat } from '../custom-socket';
import { InternalGraphql } from './internal-graphql';

export class MothershipSocket extends CustomSocket {
	private internalGraphqlSocket?: CustomSocket;
	private mothershipServersEndpoint?: {
		unsubscribe: () => void;
	};

	constructor(options: CustomSocket['options'] = {}) {
		super({
			name: 'Mothership',
			uri: MOTHERSHIP_RELAY_WS_LINK,
			logger: mothershipLogger,
			lazy: false,
			...options
		});
	}

	private connectToInternalGraphql(options: InternalGraphql['options'] = {}) {
		this.internalGraphqlSocket = new InternalGraphql(options);
	}

	private async connectToMothershipsGraphql() {
		this.mothershipServersEndpoint = await subscribeToServers(this.apiKey);
	}

	private async disconnectFromMothershipsGraphql() {
		this.mothershipServersEndpoint?.unsubscribe();
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
		const keyFile = varState.data?.regFile ? readFileIfExists(varState.data?.regFile).toString('base64') : '';
		const serverName = `${varState.data?.name}`;
		const lanIp = networkState.data.find(network => network.ipaddr[0]).ipaddr[0] || '';
		const machineId = `${await getMachineId()}`;

		return {
			'x-api-key': apiKey,
			'x-flash-guid': varState.data?.flashGuid ?? '',
			'x-key-file': keyFile ?? '',
			'x-server-name': serverName,
			'x-lan-ip': lanIp,
			'x-machine-id': machineId
		};
	}

	onConnect() {
		const mothership = this;
		const onConnect = super.onConnect;
		return async function (this: WebSocketWithHeartBeat) {
			try {
				// Run super
				onConnect();

				// Connect to local graphql
				mothership.connectToInternalGraphql();

				// Sub to /servers on mothership
				mothership.connectToMothershipsGraphql();
			} catch (error) {
				this.close(error.code.length === 4 ? error.code : `4${error.code}`, JSON.stringify({
					message: error.message ?? 'Internal Server Error'
				}));
			}
		};
	}

	onDisconnect() {
		const mothership = this;
		const onDisconnect = super.onDisconnect;
		return async function (this: WebSocketWithHeartBeat, code: number, _message: string) {
			try {
				// Close connection to local graphql endpoint
				mothership.internalGraphqlSocket?.connection?.close(200);

				// Close connection to motherships's server's endpoint
				mothership.disconnectFromMothershipsGraphql();

				// Process disconnection
				onDisconnect();
			} catch (error) {
				mothership.logger.debug('Connection closed with code=%s reason="%s"', code, error.message);
			}
		};
	}

	// When we get a message from relay send it through to our local graphql instance
	onMessage() {
		const mothership = this;
		return async function (this: WebSocketWithHeartBeat, data: string) {
			try {
				await mothership.sendMessage(mothership.internalGraphqlSocket?.connection, data);
			} catch (error) {
				// Something weird happened while processing the message
				// This is likely a malformed message
				mothership.logger.error('Failed sending message to relay.', error);
			}
		};
	}

	onError() {
		const mothership = this;
		return async function (this: WebSocketWithHeartBeat, error: NodeJS.ErrnoException) {
			try {
				mothership.logger.error(error);

				// The relay is down
				if (error.message.includes('502')) {
					// Sleep for 30 seconds
					await sleep(ONE_MINUTE / 2);
				}

				// Connection refused, aka couldn't connect
				// This is usually because the address is wrong or offline
				if (error.code === 'ECONNREFUSED') {
					// @ts-expect-error
					mothership.logger.debug('Couldn\'t connect to %s:%s', error.address, error.port);
					return;
				}

				// Closed before connection started
				if (error.toString().includes('WebSocket was closed before the connection was established')) {
					mothership.logger.debug(error.message);
					return;
				}

				throw error;
			} catch {
				// Unknown error
				mothership.logger.error('socket error', error);
			} finally {
				// Kick the connection
				this.close(4500, JSON.stringify({ message: error.message }));
			}
		};
	}
}
