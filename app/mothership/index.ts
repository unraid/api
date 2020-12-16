import WebSocket from 'ws';
import { Mutex, MutexInterface } from 'async-mutex';
import { MOTHERSHIP_RELAY_WS_LINK, INTERNAL_WS_LINK, ONE_MINUTE, ONE_SECOND } from '../consts';
import { mothershipLogger, apiManager, relayLogger } from '../core';
import { getMachineId, sleep } from '../core/utils';
import { varState, networkState } from '../core/states';
import { subscribeToServers } from './subscribe-to-servers';
import { AppError } from '../core/errors';
import { readFileIfExists, backoff } from './utils';

interface WebSocketWithHeartBeat extends WebSocket {
	heartbeat?: NodeJS.Timeout
}

function heartbeat(this: WebSocketWithHeartBeat) {
	if (this.heartbeat) {
		clearTimeout(this.heartbeat);
	}

	// Use `WebSocket#terminate()`, which immediately destroys the connection,
	// instead of `WebSocket#close()`, which waits for the close timer.
	// Delay should be equal to the interval at which your server
	// sends out pings plus a conservative assumption of the latency.
	this.heartbeat = setTimeout(() => {
		this.terminate();
	}, 30000 + 1000);
};

export class MothershipService {
	private relayWebsocketLink = MOTHERSHIP_RELAY_WS_LINK;
	private internalWsLink = INTERNAL_WS_LINK;
	private lock?: MutexInterface;
	private relay?: WebSocketWithHeartBeat;
	private connectionAttempts = {
		mothershipsRelay: 0
	};
	private localGraphqlApi?: WebSocketWithHeartBeat;
	private apiKey?: string;
	private mothershipServersEndpoint?: {
		unsubscribe: () => void;
	};

	constructor(private wsServer: WebSocket.Server) {}

	public async getLock() {
		if (!this.lock) {
			this.lock = new Mutex();
		}

		const release = await this.lock.acquire();
		return {
			release
		};
	}

	public async sendMessage(client?: WebSocketWithHeartBeat, message?: string, timeout = 1000) {
		try {
			if (!client || client.readyState === 0 || client.readyState === 3) {
				// Wait for $timeout seconds
				await sleep(timeout);
	
				// Retry sending
				await this.sendMessage(client, message, timeout);
				return;
			}
	
			// Only send when socket is open
			if (client.readyState === client.OPEN) {
				client.send(message);
				mothershipLogger.silly('Message sent to mothership.', message);
				return;
			}
	
			// Failed replying as socket isn't open
			mothershipLogger.error('Failed replying to mothership. state=%s message="%s"', client.readyState, message);
		} catch (error) {
			mothershipLogger.error('Failed replying to mothership.', error);
		};
	};

	public isConnectedToRelay() {
		// If relay && relay.readyState === CONNECTED || relay.readyState === OPEN
		return this.relay && ((this.relay.readyState === this.relay.OPEN) || (this.relay.readyState === this.relay.CONNECTING));
	}
	
	public isConnectedToLocalGraphql() {
		// If localGraphqlApi && localGraphqlApi.readyState === CONNECTED || localGraphqlApi.readyState === OPEN
		return this.localGraphqlApi && ((this.localGraphqlApi.readyState === this.localGraphqlApi.OPEN) || (this.localGraphqlApi.readyState === this.localGraphqlApi.CONNECTING));
	}

	private onLocalGraphqlError() {
		const mothership = this;
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
	
				// Re-connect to relay
				mothership.connectToLocalGraphql();
				return;
			}
	
			relayLogger.error(error);
		};
	}

	private onLocalGraphqlClose() {
		return function (code: number, reason: string) {
			relayLogger.debug('socket closed code=%s reason=%s', code, reason);
		}
	}

	private onLocalGraphqlOpen() {
		const mothership = this;
		return function (this: WebSocketWithHeartBeat, code: number, reason: string) {
			relayLogger.silly('socket opened');

			// No API key, close internal connection
			if (!mothership.apiKey) {
				mothership.localGraphqlApi?.close(4200, JSON.stringify({
					message: 'No API key'
				}));
			}

			// Authenticate with ourselves
			mothership.localGraphqlApi?.send(JSON.stringify({
				type: 'connection_init',
				payload: {
					'x-api-key': mothership.apiKey
				}
			}));
		};
	}

	private onLocalGraphqlMessage() {
		const mothership = this;
		return function (this: WebSocketWithHeartBeat, data: string) {
			try {
				mothership.relay?.send(data);
			} catch (error) {
				// Relay socket is closed, close internal one
				if (error.message.includes('WebSocket is not open')) {
					this.close(4200, JSON.stringify({
						message: error.emss
					}));
					return;
				}
			}
		};
	}

	public connectToLocalGraphql() {
		// Remove old connection
		if (this.localGraphqlApi) {
			this.localGraphqlApi.close(4200, JSON.stringify({
				message: 'Reconnecting'
			}));
		}

		this.localGraphqlApi = new WebSocket(this.internalWsLink, ['graphql-ws']);
		this.localGraphqlApi.on('ping', heartbeat);
		this.localGraphqlApi.on('error', this.onLocalGraphqlError());
		this.localGraphqlApi.on('close', this.onLocalGraphqlClose());
		this.localGraphqlApi.on('open', this.onLocalGraphqlOpen());
		this.localGraphqlApi.on('message', this.onLocalGraphqlMessage());
	}

	private async isConnectionAllowed() {
		// This should never happen
		if (!this.apiKey) {
			throw new AppError('API key was removed between the file update event and now.');
		}
	}

	private async cleanup() {
		// Kill existing socket connection
		if (this.relay) {
			this.relay.close(4200, JSON.stringify({
				message: 'Reconnecting'
			}));
		}
	}

	private async connectToMothershipsRelay() {
		const apiKey = apiManager.getKey('my_servers')?.key!;
		const keyFile = varState.data?.regFile ? readFileIfExists(varState.data?.regFile).toString('base64') : '';
		const serverName = `${varState.data?.name}`;
		const lanIp = networkState.data.find(network => network.ipaddr[0]).ipaddr[0] || '';
		const machineId = `${await getMachineId()}`;

		this.relay = new WebSocket(this.relayWebsocketLink, ['graphql-ws'], {
			headers: {
				'x-api-key': apiKey,
				'x-flash-guid': varState.data?.flashGuid ?? '',
				'x-key-file': keyFile ?? '',
				'x-server-name': serverName,
				'x-lan-ip': lanIp,
				'x-machine-id': machineId
			}
		});
	
		this.relay.on('ping', heartbeat.bind(this.relay));
		this.relay.on('open', this.onRelayOpen());
		this.relay.on('close', this.onRelayClose());
		this.relay.on('error', this.onRelayError());
		this.relay.on('message', this.onRelayMessage());
	}

	private onRelayOpen () {
		const mothership = this;
		return async function(this: WebSocketWithHeartBeat) {
			const apiKey = mothership.apiKey;
			if (!apiKey || (typeof apiKey === 'string' && apiKey.length === 0)) {
				throw new Error('Invalid key');
			}

			mothershipLogger.debug('Connected to mothership\'s relay via %s.', mothership.relayWebsocketLink);

			// Reset connection attempts
			mothership.connectionAttempts.mothershipsRelay = 0;

			// Connect to relay
			mothership.connectToLocalGraphql();

			// Sub to /servers on mothership
			mothership.mothershipServersEndpoint = await subscribeToServers(apiKey);
		};
	}

	// When we get a message from relay send it through to our local graphql instance
	private onRelayMessage() {
		const mothership = this;
		return async function (this: WebSocketWithHeartBeat, data: string) {
			try {
				await mothership.sendMessage(mothership.localGraphqlApi, data);
			} catch (error) {
				// Something weird happened while processing the message
				// This is likely a malformed message
				mothershipLogger.error('Failed sending message to relay.', error);
			}
		};
	}

	private onRelayError() {
		return async function(this: WebSocketWithHeartBeat, error: NodeJS.ErrnoException) {
			try {
				// The relay is down
				if (error.message.includes('502')) {
					// Sleep for 30 seconds
					await sleep(ONE_MINUTE / 2);
				}

				// Connection refused, aka couldn't connect
				// This is usually because the address is wrong or offline
				if (error.code === 'ECONNREFUSED') {
					// @ts-expect-error
					mothershipLogger.debug(`Couldn't connect to %s:%s`, error.address, error.port);
					return;
				}

				// Closed before connection started
				if (error.toString().includes('WebSocket was closed before the connection was established')) {
					mothershipLogger.debug(error.message);
					return;
				}

				throw error;
			} catch {
				// Unknown error
				mothershipLogger.error('socket error', error);
			} finally {
				// Kick the connection
				this.close(4500, JSON.stringify({ message: error.message }));
			}
		};
	}

	private onRelayClose() {
		const mothership = this;
		return async function (this: WebSocketWithHeartBeat, code: number, _message: string) {
			try {
				const message = _message.trim() === '' ? { message: '' } : JSON.parse(_message);
				mothershipLogger.debug('Connection closed with code=%s reason="%s"', code, code === 1006 ? 'Terminated' : message.message);
	
				// Stop ws heartbeat
				if (this.heartbeat) {
					clearTimeout(this.heartbeat);
				}
	
				// Close connection to local graphql endpoint
				mothership.localGraphqlApi?.close();
	
				// Http 4XX error
				if (code >= 4400 && code <= 4499) {
					// Unauthorized - No API key?
					if (code === 4401) {
						mothershipLogger.debug('Invalid API key, waiting for new key...');
						return;
					}
	
					// Rate limited
					if (code === 4429) {
						try {
							let interval: NodeJS.Timeout | undefined;
							const retryAfter = parseInt(message['Retry-After'], 10) || 30;
							mothershipLogger.debug('Rate limited, retrying after %ss', retryAfter);
	
							// Less than 30s
							if (retryAfter <= 30) {
								let i = retryAfter;
	
								// Print retry once per second
								interval = setInterval(() => {
									i--;
									mothershipLogger.debug(`Retrying mothership connection in ${i}s`);
								}, ONE_SECOND);
							}
	
							if (retryAfter >= 1) {
								await sleep(ONE_SECOND * retryAfter);
							}
	
							if (interval) {
								clearInterval(interval);
							}
						} catch {};
					}
				}
	
				// We likely closed this
				// This is usually because the API key is updated
				if (code === 4200) {
					// Reconnect
					mothership.connect();
					return;
				}
	
				// Something went wrong on mothership
				// Let's wait an extra bit
				if (code === 4500) {
					await sleep(ONE_SECOND * 5);
				}
			} catch (error) {
				mothershipLogger.debug('Connection closed with code=%s reason="%s"', code, error.message);
			}
	
			try {
				// Wait a few seconds
				await sleep(backoff(mothership.connectionAttempts.mothershipsRelay, ONE_MINUTE, 5));
	
				// Reconnect
				await mothership.connect(mothership.connectionAttempts.mothershipsRelay + 1);
			} catch (error) {
				mothershipLogger.debug('Failed reconnecting to mothership reason="%s"', error.message);
			}
		};
	}

	private async setRetryAttempt(currentRetryAttempt = 0) {
		this.connectionAttempts.mothershipsRelay += 1;
		if (currentRetryAttempt >= 1) {
			mothershipLogger.debug('connection attempt %s', currentRetryAttempt);
		}
	}

	private async setApiKey() {
		const key = apiManager.getKey('my_servers');
		if (!key) {
			throw new AppError('No API key found.');
		}

		this.apiKey = key.key;
	}

	public async connect(retryAttempt: number = 0): Promise<void> {
        const lock = await this.getLock();
		try {
			// Ensure we have a key before connecting
			await this.setApiKey();

			// Set retry attemmpt count
			await this.setRetryAttempt(retryAttempt);

			// Check the connection is allowed
			await this.isConnectionAllowed();

			// Cleanup old connections
			await this.cleanup();

			// Connect to mothership's relay endpoint
			await this.connectToMothershipsRelay();
		} catch (error) {
			mothershipLogger.error('Failed connecting reason=%s', error.message);
		} finally {
			lock.release();
		}
	}
	
	public async disconnect() {
		const lock = await this.getLock();
		try {
			if (this.relay && (this.relay?.readyState !== this.relay?.CLOSED)) {
				// 4200 === ok
				this.relay.close(4200);
			}
		} catch(error) {
			mothershipLogger.error('Failed disconnecting reason=%s', error.message);
		} finally {
			lock.release();
		}
	}
};