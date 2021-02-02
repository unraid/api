import WebSocket, { Server as WebsocketServer } from 'ws';
import { Mutex, MutexInterface } from 'async-mutex';
import { ONE_SECOND, ONE_MINUTE } from '../consts';
import { log } from '../core';
import { AppError } from '../core/errors';
import { isNodeError, sleep } from '../core/utils';
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
					throw new AppError('Missing key', 4422);
				}

				logger.debug('Connected via %s.', connection?.url);

				// Reset connection attempts
				customSocket.connectionAttempts = 0;
			} catch (error: unknown) {
				if (isNodeError(error, AppError)) {
					this.close(Number(error.code?.length === 4 ? error.code : `4${error.code ?? 500}`), JSON.stringify({
						message: error.message ?? 'Internal Server Error'
					}));
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
		const lock = await this.getLock();
		try {
			// Set retry attempt count
			await this.setRetryAttempt(retryAttempt);

			// Get the current apiKey
			this.apiKey = await this.getApiKey();

			// Check the connection is allowed
			await this.isConnectionAllowed();

			// Cleanup old connections
			await this.cleanup();

			// Connect to endpoint
			await this._connect();

			// Log we connected
			this.logger.debug('Connected to %s', this.uri);
		} catch (error: unknown) {
			if (isNodeError(error, AppError)) {
				this.logger.error('Failed connecting reason=%s', error.message);
			}
		} finally {
			lock.release();
		}
	}

	public async disconnect() {
		const lock = await this.getLock();
		try {
			if (this.connection && (this.connection.readyState !== this.connection.CLOSED)) {
				// 4200 === ok
				this.connection.close(4200);
			}
		} catch (error: unknown) {
			if (isNodeError(error, AppError)) {
				this.logger.error('Failed disconnecting reason=%s', error.message);
			}
		} finally {
			lock.release();
		}
	}

	public async reconnect() {
		this.logger.debug('Reconnecting...');
		await this.disconnect();
		this.logger.debug('Disconnected, waiting 1s before reconnecting.');
		await sleep(1000);
		await this.connect();
		this.logger.debug('Reconnected');
	}

	protected onDisconnect() {
		const logger = this.logger;
		const connect = this.connect.bind(this);
		const connectionAttempts = this.connectionAttempts;
		const uri = this.uri;
		const responses = {
			// OK
			4200: async () => {
				// This is usually because the API key is updated
				// Let's reset the reconnect count so we reconnect instantly
				this.connectionAttempts = 0;
			},
			// Unauthorized - Invalid/missing API key.
			4401: async () => {
				this.logger.debug('Invalid API key, waiting for new key...');
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
		return async function (this: WebSocketWithHeartBeat, code: number, _message: string) {
			try {
				const message: { message?: string } = _message.trim() === '' ? { message: '' } : JSON.parse(_message);
				logger.debug('Connection closed with code=%s reason="%s"', code, code === 1006 ? 'Terminated' : message.message);

				// Stop ws heartbeat
				if (this.heartbeat) {
					clearTimeout(this.heartbeat);
				}

				// Known status code
				if (Object.keys(responses).includes(`${code}`)) {
					await responses[code](message);
				} else {
					// Unknown status code
					await responses[4500]();
				}
			} catch (error: unknown) {
				if (isNodeError(error, AppError)) {
					logger.debug('Connection closed with code=%s reason="%s"', code, error.message);
				}
			}

			try {
				// Wait a few seconds
				await sleep(backoff(connectionAttempts, ONE_MINUTE, 5));

				// Reconnect
				await connect(connectionAttempts + 1);
			} catch (error: unknown) {
				if (isNodeError(error, AppError)) {
					logger.debug('Failed reconnecting to %s reason="%s"', uri, error.message);
				}
			}
		};
	}

	protected async cleanup() {
		// Kill existing socket connection
		if (this.connection?.heartbeat) {
			this.connection.close(4200, JSON.stringify({
				message: 'Reconnecting'
			}));
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

	protected async sendMessage(client?: WebSocketWithHeartBeat, message?: string, timeout = 1000) {
		try {
			if (!client || client.readyState === 0 || client.readyState === 3) {
				this.logger.silly('Waiting %ss to retry sending to %s.', timeout / 1000, client?.url);
				// Wait for $timeout seconds
				await sleep(timeout);

				// Retry sending
				await this.sendMessage(client, message, timeout);
				return;
			}

			// Only send when socket is open
			if (client.readyState === client.OPEN) {
				client.send(message);
				this.logger.silly('Message sent to %s.', client?.url);
				return;
			}

			// Failed replying as socket isn't open
			this.logger.error('Failed replying to %s. state=%s message="%s"', client?.url, client.readyState, message);
		} catch (error: unknown) {
			if (isNodeError(error, AppError)) {
				this.logger.error('Failed replying to %s.', client?.url, error);
			}
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
	}
}
