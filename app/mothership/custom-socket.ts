import { Mutex, MutexInterface } from 'async-mutex';
import WebSocket, { Server as WebsocketServer } from 'ws';

import { ONE_MINUTE, ONE_SECOND } from '../consts';
import { log } from '../core';
import { AppError } from '../core/errors';
import { isNodeError, sleep } from '../core/utils';
import { sockets } from '../sockets';
import { backoff } from './utils';

export interface WebSocketWithHeartBeat extends WebSocket {
	heartbeat?: NodeJS.Timeout;
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
}

interface Options {
	name: string;
	uri: string;
	apiKey: string;
	logger: typeof log;
	lazy: boolean;
	wsServer: WebsocketServer;
}

export class CustomSocket {
	public name: string;
	public uri: string;
	public connection?: WebSocketWithHeartBeat;

	protected apiKey: string;
	protected logger: typeof log;
	protected connectionAttempts = 0;

	private lock?: MutexInterface;
	private isOutdated = false;

	constructor(public options: Partial<Options> = {}) {
		this.name = options.name ?? 'CustomSocket';
		this.uri = options.uri ?? 'localhost';
		this.apiKey = options.apiKey ?? '';
		this.logger = options.logger ?? log;

		// Connect right away
		if (!options.lazy) {
			this.connect().catch((error: unknown) => {
				if (isNodeError(error)) {
					log.error('Failed connecting with error %s', error.message);
				}
			});
		}
	}

	public isConnected() {
		return this.connection && (this.connection.readyState === this.connection.OPEN);
	}

	public isConnecting() {
		return this.connection && (this.connection.readyState === this.connection.CONNECTING);
	}

	public onError() {
		return (error: NodeJS.ErrnoException) => {
			this.logger.error(error);
		};
	}

	public onConnect() {
		const logger = this.logger;
		const connection = this.connection;
		const apiKey = this.apiKey;
		// eslint-disable-next-line @typescript-eslint/no-this-alias
		const customSocket = this;
		return async function (this: WebSocketWithHeartBeat) {
			try {
				if (!apiKey || (typeof apiKey === 'string' && apiKey.length === 0)) {
					throw new AppError('Missing key', 422);
				}

				logger.debug('Connected via %s.', connection?.url);

				// Reset connection attempts
				customSocket.connectionAttempts = 0;
			} catch (error: unknown) {
				if (isNodeError(error, AppError)) {
					this.close(Number(error.code ?? 500), 'INTERNAL_SERVER_ERROR');
				} else {
					this.close(500, 'INTERNAL_SERVER_ERROR');
				}
			}
		};
	}

	public onMessage() {
		const logger = this.logger;
		return async function (message: string, ...args: any[]) {
			logger.silly('message="%s" args="%s"', message, ...args);
		};
	}

	public async connect(retryAttempt = 0) {
		if (this.isOutdated) {
			this.logger.error('This client is currently outdated, please update unraid-api to reconnect!');
			return;
		}

		this.logger.debug('Connecting to %s', this.uri);
		const lock = await this.getLock();
		try {
			this.logger.debug('Lock aquired for connection to %s', this.uri);

			// Set retry attempt count
			await this.setRetryAttempt(retryAttempt);

			// Get the current apiKey
			this.apiKey = await this.getApiKey();

			// Check the connection is allowed
			await this.isConnectionAllowed();

			// Cleanup old connections
			// await this.cleanup();

			// Connect to endpoint
			await this._connect();

			// Log we connected
			this.logger.debug('Connected to %s', this.uri);
		} catch (error: unknown) {
			this.logger.error('Failed connecting reason=%s', (error as Error).message);
		} finally {
			lock.release();
		}
	}

	public async disconnect(code?: number, message?: string) {
		this.logger.debug('Disconnecting from %s', this.uri);
		const lock = await this.getLock();
		try {
			this.logger.debug('Lock aquired for disconnection from %s', this.uri);

			// Don't try and disconnect if there's no connection
			if (!this.connection || (this.connection.readyState === this.connection.CLOSED)) {
				this.logger.debug('Cannot disconnect from %s as it\'s already disconnected', this.uri);
				return;
			}

			// If there's a custom code pass it to the close method
			if (code) {
				this.logger.error('Disconnect with code=%s reason=%s', code, message);
				this.connection.close(code, message);
				return;
			}

			// Fallback to a "ok" disconnect
			// 4200 === ok
			this.logger.error('Disconnect with code=%s reason=%s', code, 'OK');
			this.connection.close(4200, '{"message":"OK"}');
		} catch (error: unknown) {
			this.logger.error('Failed disconnecting code=%s reason=%s', code, (error as Error).message);
		} finally {
			lock.release();
		}
	}

	public async reconnect() {
		this.logger.warn(`Reconnecting to ${this.uri}`);
		return this.disconnect();
	}

	protected onDisconnect() {
		// Connection attempts
		let connectionAttempts = this.connectionAttempts;
		let shouldReconnect = true;

		const logger = this.logger;
		const connect = this.connect.bind(this);
		const uri = this.uri;
		const responses = {
			// Mothership dropped, this can happen for various reasons
			// 1. Mothership's relay restarted
			// 2. The client's internet restarted
			// 3. The client's internet is flakey
			// 4. Who knows?
			1006: async () => {
				// We some how lost connection to mothership, this was not expected by the client.
				// Let's give mothership's relay time to come back up incase it restarted reconnect.
				this.logger.debug('We lost connection to mothership, reconnecting...');

				// Wait for 30s before allowing reconnection
				await sleep(ONE_SECOND * 30);

				// Let's reset the reconnect count so we reconnect instantly
				this.connectionAttempts = 0;
				connectionAttempts = 0;
			},
			// OK
			4200: async () => {
				// This is usually because the API key is updated
				// Let's reset the reconnect count so we reconnect instantly
				this.connectionAttempts = 0;
				connectionAttempts = 0;
			},
			// Unauthorized - Invalid/missing API key.
			4401: async () => {
				this.logger.debug('Invalid API key, waiting for new key...');
				shouldReconnect = false;
			},
			// Request Timeout - Mothership disconnected us.
			4408: async () => {
				// Mothership kicked this connection for any number of reasons
				this.logger.debug('Kicked by mothership, reconnecting...');

				// Wait for 5s before allowing reconnection
				await sleep(ONE_SECOND * 5);

				// Let's reset the reconnect count so we reconnect instantly
				this.connectionAttempts = 0;
				connectionAttempts = 0;
			},
			// Outdated
			4426: async () => {
				// Mark this client as outdated so it doesn't reconnect
				this.isOutdated = true;
			},
			// Rate limited
			4429: async message => {
				try {
					let interval: NodeJS.Timeout | undefined;
					const retryAfter = parseInt(message['Retry-After'], 10) || 30;
					this.logger.debug('Rate limited, retrying after %ss', retryAfter);

					// Less than 30s
					if (retryAfter <= 30) {
						let seconds = retryAfter;

						// Print retry once per second
						interval = setInterval(() => {
							seconds--;
							this.logger.debug('Retrying connection in %ss', seconds);
						}, ONE_SECOND);
					}

					if (retryAfter >= 1) {
						await sleep(ONE_SECOND * retryAfter);
					}

					if (interval) {
						clearInterval(interval);
					}
				} catch {}
			},
			// Server Error
			4500: async () => {
				// Something went wrong on the connection
				// Let's wait an extra bit
				await sleep(ONE_SECOND * 5);
			}
		};
		return async function (this: WebSocketWithHeartBeat, code: number, message: string) {
			try {
				// Log disconnection
				logger.error('Connection closed with code=%s reason="%s"', code, code === 1006 ? 'Terminated' : message);

				// Stop ws heartbeat
				if (this.heartbeat) {
					clearTimeout(this.heartbeat);
				}

				// Known status code
				if (Object.keys(responses).includes(`${code}`)) {
					await responses[code](message);
				} else {
					// Unknown status code
					await responses[500]();
				}
			} catch (error: unknown) {
				logger.error('Connection closed with code=%s reason="%s"', code, (error as Error).message);
			}

			// We shouldn't reconnect
			if (!shouldReconnect) {
				logger.error('Skipping reconnecting to %s as "shouldReconnect" is true', uri);
				return;
			}

			try {
				const sleepMs = backoff(connectionAttempts, ONE_MINUTE, 5);
				logger.error('Waiting for %s before re-connecting to %s', sleepMs, uri);

				// Wait a few seconds
				await sleep(sleepMs);

				// Reconnect
				logger.error('Establishing connection to %s', uri);
				await connect(connectionAttempts + 1);
			} catch (error: unknown) {
				logger.error('Failed reconnecting to %s reason="%s"', uri, (error as Error).message);
			}
		};
	}

	protected async cleanup() {
		// Kill existing socket connection
		if (this.connection?.heartbeat) {
			this.connection.close(408, 'REQUEST_TIMEOUT');
		}
	}

	protected async getApiKey() {
		return '';
	}

	protected async getHeaders() {
		return {};
	}

	protected async isConnectionAllowed() {
		return true;
	}

	protected async sendMessage(clientName: 'relay' | 'internalGraphql', message?: string, timeout = 1000) {
		const client = sockets.get(clientName)?.connection;

		try {
			if (!client || client.readyState === client.CONNECTING) {
				this.logger.silly('Waiting %ss to retry sending to %s.', timeout / 1000, client?.url);
				// Wait for $timeout seconds
				await sleep(timeout);

				// Retry sending
				return this.sendMessage(clientName, message, timeout);
			}

			// Only send when socket is open
			if (client.readyState === client.OPEN) {
				client.send(message);
				this.logger.silly('Message sent to %s.', client?.url);
				return;
			}

			// Wait 10 seconds if we're closed
			if (client.readyState === client.CLOSED) {
				// Connection closed waiting 10s to retry
				await sleep(10 * ONE_SECOND);

				// Retry sending
				return this.sendMessage(clientName, message, timeout);
			}

			// Failed replying as socket isn't open
			this.logger.error('Failed replying to %s. state=%s message="%s"', client?.url, client.readyState, message);
		} catch (error: unknown) {
			this.logger.error('Failed replying to %s with %s.', client?.url, (error as Error).message);
		}
	}

	private async getLock() {
		if (!this.lock) {
			this.lock = new Mutex();
		}

		const release = await this.lock.acquire();
		return {
			release
		};
	}

	private async setRetryAttempt(currentRetryAttempt = 0) {
		this.connectionAttempts += 1;
		if (currentRetryAttempt >= 1) {
			this.logger.debug('Connection attempt %s', currentRetryAttempt);
		}
	}

	private async _connect() {
		this.connection = new WebSocket(this.uri, ['graphql-ws'], {
			headers: await this.getHeaders()
		});

		this.connection.on('ping', heartbeat.bind(this.connection));
		this.connection.on('error', this.onError());
		this.connection.on('close', this.onDisconnect());
		this.connection.on('open', this.onConnect());
		this.connection.on('message', this.onMessage());

		// Unbind handlers and then kill the connection
		process.once('SIGTERM', () => {
			this.logger.info('Closing mothership connection...');

			// Unbind handlers
			this.connection?.removeAllListeners();

			// Kill connection with mothership
			this.connection?.close();

			this.logger.info('Closed mothership connection!');
			this.logger.info('Process exiting...');

			process.exit(0);
		});
	}
}
