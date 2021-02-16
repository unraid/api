import { MOTHERSHIP_RELAY_WS_LINK, ONE_MINUTE } from '../../consts';
import { mothershipLogger, apiManager } from '../../core';
import { getMachineId, isNodeError, sleep } from '../../core/utils';
import { varState, networkState } from '../../core/states';
import { subscribeToServers } from '../subscribe-to-servers';
import { AppError } from '../../core/errors';
import { readFileIfExists } from '../utils';
import { CustomSocket, WebSocketWithHeartBeat } from '../custom-socket';

export class MothershipSocket extends CustomSocket {
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

	onConnect() {
		const connectToMothershipsGraphql = this.connectToMothershipsGraphql.bind(this);
		const onConnect = super.onConnect.bind(this);
		return async function (this: WebSocketWithHeartBeat) {
			try {
				// Run super
				onConnect();

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
		const keyFile = varState.data?.regFile ? readFileIfExists(varState.data?.regFile).toString('base64') : '';
		const serverName = `${varState.data?.name as string}`;
		const lanIp: string = networkState.data.find(network => network.ipaddr[0]).ipaddr[0] || '';
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

	private async connectToMothershipsGraphql() {
		this.mothershipServersEndpoint = await subscribeToServers(this.apiKey);
	}

	private async disconnectFromMothershipsGraphql() {
		this.mothershipServersEndpoint?.unsubscribe();
	}
}
