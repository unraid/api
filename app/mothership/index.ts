import fs from 'fs';
import WebSocket from 'ws';
import { Mutex, MutexInterface } from 'async-mutex';
import { MOTHERSHIP_RELAY_WS_LINK, INTERNAL_WS_LINK, ONE_MINUTE, ONE_SECOND } from '../consts';
import { mothershipLogger, apiManager, relayLogger } from '../core';
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
		const mothership = this;
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

			// Kill existing socket before overriding
			if (this.relay) {
				this.relay.terminate();
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
				mothership.connectionAttempt = 0;
		
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
					if (error.message === 'WebSocket was closed before the connection was established') {
						// Likely the internal relay-ws connection was started but then mothership
						// decided the key was invalid so it killed it
						// When this happens the relay-ws sometimes is still in the CONNECTING phase
						// This isn't an actual error so we skip it
						return;
					}
					relayLogger.error(error.message);
				});
				
				// Connection to local graphql endpoint is "closed"
				this.localGraphqlApi.on('close', (code, reason) => {
					relayLogger.silly('socket closed code=%s reason=%s', code, reason);
				});
		
				// Connection to local graphql endpoint is "open"
				this.localGraphqlApi.on('open', () => {
					relayLogger.silly('socket opened');
		
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
							return;
						}
					}
				});
		
				// Sub to /servers on mothership
				this.mothershipServersEndpoint = await subscribeToServers(apiKey);
			});

			// Relay is closed
			this.relay.on('close', async function (this: WebSocketWithHeartBeat, code, _message) {
				try {
					const message = _message.trim() === '' ? { message: '' } : JSON.parse(_message);
					mothershipLogger.debug('Connection closed with code=%s reason="%s"', code, code === 1006 ? 'Terminated' : message.message);
		
					// Stop ws heartbeat
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
						mothership.connect(wsServer);
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
					await sleep(backoff(mothership.connectionAttempt, ONE_MINUTE, 5));
		
					// Reconnect
					await mothership.connect(wsServer, mothership.connectionAttempt + 1);
				} catch (error) {
					mothershipLogger.debug('Failed reconnecting to mothership reason="%s"', error.message);
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