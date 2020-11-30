import fs from 'fs';
import WebSocket from 'ws';
import * as Sentry from '@sentry/node';
import { Mutex, MutexInterface } from 'async-mutex';
import { MOTHERSHIP_RELAY_WS_LINK, INTERNAL_WS_LINK, ONE_MINUTE } from '../consts';
import { mothershipLogger, apiManager } from '../core';
import { getMachineId } from '../core/utils';
import { varState, networkState } from '../core/states';
import { subscribeToServers } from './subscribe-to-servers';
import { AppError } from '../core/errors';

/**
 * Get a number between the lowest and highest value.
 * @param low Lowest value.
 * @param high Highest value.
 */
const getNumberBetween = (low: number, high: number) => Math.floor(Math.random() * (high - low + 1) + low);

/**
 * Create a jitter of +/- 20%.
 */
const applyJitter = (value: number) => {
	const jitter = getNumberBetween(80, 120) / 100;
	return Math.floor(value * jitter);
};

const backoff = (attempt: number, maxDelay: number, multiplier: number) => {
	const delay = applyJitter((Math.pow(2.0, attempt) - 1.0) * 0.5);
	return Math.round(Math.min(delay * multiplier, maxDelay));
};

interface WebSocketWithHeartBeat extends WebSocket {
	pingTimeout?: NodeJS.Timeout
}

function heartbeat(this: WebSocketWithHeartBeat) {
	if (this.pingTimeout) {
		clearTimeout(this.pingTimeout);
	}

	// Use `WebSocket#terminate()`, which immediately destroys the connection,
	// instead of `WebSocket#close()`, which waits for the close timer.
	// Delay should be equal to the interval at which your server
	// sends out pings plus a conservative assumption of the latency.
	this.pingTimeout = setTimeout(() => {
		this.terminate();
	}, 30000 + 1000);
};

const readFileIfExists = (filePath: string) => {
	try {
		return fs.readFileSync(filePath);
	} catch {}

	return Buffer.from('');
};

class MothershipService {
	private relayWebsocketLink = MOTHERSHIP_RELAY_WS_LINK;
	private internalWsLink = INTERNAL_WS_LINK;

	private lock?: MutexInterface;
	private relay?: WebSocket;
	private connectionAttempt = 0;
	private localGraphqlApi?: WebSocketWithHeartBeat;
	private mothershipServersEndpoint?: {
		unsubscribe: () => void;
	};

	constructor() {}

	public async getLock() {
		if (!this.lock) {
			this.lock = new Mutex();
		}

		const release = await this.lock.acquire();
		return {
			release
		};
	}

	public isConnectedToRelay() {
		return this.relay && (this.relay?.readyState !== this.relay?.CLOSED);
	}
	
	public isConnectedToLocalGraphql() {
		return this.localGraphqlApi && (this.localGraphqlApi?.readyState !== this.localGraphqlApi?.CLOSED);
	}

	public async connect(wsServer: WebSocket.Server, currentRetryAttempt: number = 0): Promise<void> {
		this.connectionAttempt++;
		if (currentRetryAttempt >= 1) {
			mothershipLogger.debug('connection attempt %s', currentRetryAttempt);
		}

        const lock = await this.getLock();
		try {
			const apiKey = apiManager.getKey('my_servers')?.key!;
			const keyFile = varState.data?.regFile ? readFileIfExists(varState.data?.regFile).toString('base64') : '';
			const serverName = `${varState.data?.name}`;
			const lanIp = networkState.data.find(network => network.ipaddr[0]).ipaddr[0] || '';
			const machineId = `${await getMachineId()}`;

			// This should never happen
			if (!apiKey) {
				throw new AppError('API key was removed between the file update event and now.');
			}
		
			// Connect to mothership's relay endpoint
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
		
			this.relay.on('open', async () => {
				mothershipLogger.debug('Connected to mothership\'s relay via %s.', this.relayWebsocketLink);
		
				// Reset connection attempts
				this.connectionAttempt = 0;
		
				// Connect to the internal graphql server
				this.localGraphqlApi = new WebSocket(this.internalWsLink, ['graphql-ws']);
		
				// Heartbeat
				this.localGraphqlApi.on('ping', () => {
					if (this.localGraphqlApi) {
						heartbeat.bind(this.localGraphqlApi)();
					}
				});
		
				// Errors
				this.localGraphqlApi.on('error', error => {
					Sentry.captureException(error);
					mothershipLogger.error('ws:local-relay', 'error', error);
				});
				
				// Connection to local graphql endpoint is "closed"
				this.localGraphqlApi.on('close', () => {
					mothershipLogger.silly('ws:local-relay', 'close');
				});
		
				// Connection to local graphql endpoint is "open"
				this.localGraphqlApi.on('open', () => {
					mothershipLogger.silly('ws:local-relay', 'open');
		
					// No API key, close internal connection
					if (!apiKey) {
						this.localGraphqlApi?.close();
					}

					// Authenticate with ourselves
					this.localGraphqlApi?.send(JSON.stringify({
						type: 'connection_init',
						payload: {
							'x-api-key': apiKey
						}
					}));
				});
		
				// Relay message back to mothership
				this.localGraphqlApi.on('message', (data) => {
					try {
						this.relay?.send(data);
					} catch (error) {
						// Relay socket is closed, close internal one
						if (error.message.includes('WebSocket is not open')) {
							this.localGraphqlApi?.close();
						}
					}
				});
		
				// Sub to /servers on mothership
				this.mothershipServersEndpoint = subscribeToServers(apiKey);
			});
		
			// Relay is closed
			const mothership = this;
			this.relay.on('close', async function (this: WebSocketWithHeartBeat, code, _message) {
				try {
					mothershipLogger.debug('Connection closed with code %s.', code);
		
					if (this.pingTimeout) {
						clearTimeout(this.pingTimeout);
					}
		
					// Close connection to local graphql endpoint
					mothership.localGraphqlApi?.close();
		
					// Clear all listeners before running this again
					mothership.relay?.removeAllListeners();
		
					// Stop subscriptions with mothership
					mothership.mothershipServersEndpoint?.unsubscribe();
		
					// Http 4XX error
					if (code >= 4400 && code <= 4499) {
						// Unauthorized - No API key?
						if (code === 4401) {
							mothershipLogger.debug('Invalid API key, waiting for new key...');
							return;
						}
					}
		
					// We likely closed this
					// This is usually because the API key is updated
					if (code === 4200) {
						// Reconnect
						mothership.connect(wsServer);
						return;
					}
					
					// Wait a few seconds
					await sleep(backoff(mothership.connectionAttempt, ONE_MINUTE, 5));
		
					// Reconnect
					await mothership.connect(wsServer, currentRetryAttempt + 1);
				} catch (error) {
					mothershipLogger.error('close error', error);
				}
			});
		
			this.relay.on('error', (error: NodeJS.ErrnoException) => {
				// The relay is down
				if (error.message.includes('502')) {
					return;
				}
		
				// Connection refused, aka couldn't connect
				// This is usually because the address is wrong or offline
				if (error.code === 'ECONNREFUSED') {
					// @ts-expect-error
					mothershipLogger.debug(`Couldn't connect to %s:%s`, error.address, error.port);
					return;
				}

				if (error.toString().includes('WebSocket was closed before the connection was established')) {
					mothershipLogger.debug(error.message);
					return;
				}

				mothershipLogger.error('socket error', error);
			});
		
			this.relay.on('ping', heartbeat);
		
			const sleep = (number: number) => new Promise(resolve => setTimeout(() => resolve(), number));
			const sendMessage = async (client?: WebSocketWithHeartBeat, message?: string, timeout = 1000) => {
				try {
					if (!client || client.readyState === 0) {
						// Wait for $timeout seconds
						await sleep(timeout);

						// Retry sending
						await sendMessage(client, message, timeout);
						return;
					}
		
					client.send(message);
					mothershipLogger.silly('Message sent to mothership.', message);
				} catch (error) {
					mothershipLogger.error('Failed replying to mothership.', error);
				};
			};
		
			// When we get a message from relay send it through to our local graphql instance
			this.relay.on('message', async (data: string) => {
				try {
					await sendMessage(this.localGraphqlApi, data);
				} catch (error) {
					// Something weird happened while processing the message
					// This is likely a malformed message
					mothershipLogger.error('Failed sending message to relay.', error);
				}
			});
		} catch (error) {
			mothershipLogger.error('Failed connecting', error);
		} finally {
			lock.release();
		}
	}
	
	async disconnect() {
		const lock = await this.getLock();
		try {
			if (this.relay && (this.relay?.readyState !== this.relay?.CLOSED)) {
				// 4200 === ok
				this.relay.close(4200);
			}
		} catch(error) {
		} finally {
			lock.release();
		}
	}
};

export const mothership = new MothershipService();