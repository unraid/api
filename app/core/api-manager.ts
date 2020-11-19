/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import chokidar from 'chokidar';
import { EventEmitter } from 'events';
import toMillisecond from 'ms';
import dotProp from 'dot-prop';
import { Cache as MemoryCache } from 'clean-cache';
// @ts-ignore
import { validate as validateArgument } from 'bycontract';
import { Mutex, MutexInterface } from 'async-mutex';
import { validateApiKeyFormat, loadState, validateApiKey } from './utils';
import { paths } from './paths';
import { coreLogger } from './log';

export interface CacheItem {
	/** Machine readable name of the key. */
	name: string;
	/** Owner's id */
	userId: string;
	/** The API key. */
	key: string;
	/** When the key will expire in human readable form. This will be converted internally to ms. */
	expiration: string;
}

export interface KeyOptions {
	/** Owner's id */
	userId?: string;
	/** When the key will expire in human readable form. This will be converted internally to ms. */
	expiration?: string;
}

interface ApiKey {
	name: string;
	key: string;
	userId: string;
	expiresAt: number;
}

interface Options {
	watch: boolean;
}

/**
 * Api manager
 */
export class ApiManager extends EventEmitter {
	private static instance: ApiManager;

	/** Note: Keys expire by default after 365 days. */
	private readonly keys = new MemoryCache<CacheItem>(Number(toMillisecond('1y')));
	
	private lock?: MutexInterface;
	private async getLock() {
		if (!this.lock) {
			this.lock = new Mutex();
		}

		const release = await this.lock.acquire();
		return {
			release
		};
	}

	constructor(options: Options = { watch: true }) {
		super({
			captureRejections: true
		});

		// Return or create the singleton class
		if (ApiManager.instance) {
			// @eslint-disable-next-line no-constructor-return
			return ApiManager.instance;
		}

		// Create singleton
		ApiManager.instance = this;

		// Watch for changes to the dynamix.cfg file
		// @todo Move API keys to their own file
		if (options.watch) {
			const basePath = paths.get('dynamix-base')!;
			const configPath = paths.get('dynamix-config')!;
			chokidar.watch(basePath).on('all', async (_eventName, filePath) => {
				if (filePath === configPath) {
					const lock = await this.getLock();
					try {
						const file = loadState<{ remote: { apikey: string } }>(filePath);
						const apiKey = dotProp.get(file, 'remote.apikey') as string;

						// Same key as current
						if (apiKey === this.getKey('my_servers')?.key) {
							coreLogger.debug(`%s was updated but the API key didn't change`, filePath);
							return;
						}

						// Ensure key format is valid before validating
						validateApiKeyFormat(apiKey);

						// Ensure key is valid before connecting
						await validateApiKey(apiKey);

						// Add the new key
						this.replace('my_servers', apiKey, {
							userId: '0'
						});
					} catch (error) {
						// File was deleted
						if (error.code === 'ENOENT') {
							coreLogger.debug('%s was deleted, removing "my_servers" API key.', filePath);
						} else {
							coreLogger.debug('%s, removing "my_servers" API key.', error.message);
						}

						// Reset key as it's not valid anymore
						this.expire('my_servers');
					} finally {
						lock.release();
					}
				}
			});
		}
	}

	/**
	 * Replace a key.
	 * 
	 * Note: This will bump the expiration by the original length.
	 */
	replace(name: string, key: string, options: KeyOptions) {
		// Delete existing key
		// @ts-ignore
		this.keys.items[name] = null;

		// Add new key
		this.add(name, key, options);

		// Emit update
		this.emit('replace', name, this.getKey(name));
	}

	/**
	 * Add a new key.
	 *
	 * Note: Keys expire by default after 365 days.
	 *
	 * @memberof ApiManager
	 */
	add(name: string, key: string, options: KeyOptions): void {
		const { userId, expiration = '1y' } = options;

		validateArgument(name, 'string');
		validateArgument(key, 'string');
		validateArgument(expiration, 'string|number');

		const ttl = Number(toMillisecond(expiration));
		const keyObject = {
			name,
			key,
			userId
		};

		// Add new key
		this.keys.add(name, keyObject, ttl);

		// Emit update
		this.emit('add', name, this.getKey(name));
	}

	/**
	 * Is valid based on "name and key" or just "key".
	 *
	 * @param nameOrKey The name or key of the API key.
	 * @param key The API key.
	 * @returns `true` if the key is valid, otherwise `false`.
	 * @memberof ApiManager
	 */
	isValid(nameOrKey: string, key?: string): boolean {
		validateArgument(nameOrKey, 'string');
		validateArgument(key, 'string|undefined');

		if (!key) {
			try {
				const name = this.getNameFromKey(nameOrKey);

				if (!name) {
					return false;
				}

				// We still have to run the retrieve after finding the key
				// as this will run the cache validation check
				// without this the key would be "valid" even after
				// it's over the cache time
				return this.keys.get(name) !== null;
			} catch {
				return false;
			}
		}

		const foundKey = this.keys.get(`${nameOrKey}`)?.key;
		if (!foundKey) {
			return false;
		}

		return foundKey === key;
	}

	/**
	 * Return key based on name.
	 *
	 * @param name The API key's machine readable name.
	 * @returns {Object} The API key based on the name provided.
	 * @memberof ApiManager
	 */
	getKey(name: string): CacheItem | null {
		validateArgument(name, 'string');

		return this.keys.get(name);
	}

	/**
	 * Is key expired based on name.
	 *
	 * @param name The API key's machine readable name.
	 * @returns `true` if the key has expired, otherwise `false`.
	 * @memberof ApiManager
	 */
	expired(name: string): boolean {
		validateArgument(name, 'string');

		return this.keys.get(name) === null;
	}

	/**
	 * Invalidate an API Key.
	 *
	 * @param name The API key's machine readable name.
	 * @memberof ApiManager
	 */
	expire(name: string): void {
		validateArgument(name, 'string');

		this.keys.invalidate(name);
		this.emit('expire', name);
	}

	/**
	 * Return all valid API keys.
	 *
	 * @returns All of the API keys.
	 * @memberof ApiManager
	 */
	getValidKeys(): ApiKey[] {
		const keys = Object.entries(this.keys.items);

		return keys
			.filter(([, item]) => this.isValid(item.value.key))
			.map(([name, item]) => ({
				name,
				// @ts-ignore
				key: item.value.key,
				userId: item.value.userId,
				expiresAt: item.expiresAt
			}));
	}

	/**
	 * Return the key's name based on the key value.
	 *
	 * @param key The API key.
	 * @returns The API key's machine readable name.
	 * @memberof ApiManager
	 */
	getNameFromKey(key: string): string {
		validateArgument(key, 'string');

		const keyObject = Object
			.entries(this.keys.items)
			// @ts-ignore
			.find(([_, item]) => item.value.key === key);

		if (!keyObject) {
			throw new Error(`No name found for "${key}".`);
		}

		return keyObject[0];
	}
}

export const apiManager = new ApiManager();
