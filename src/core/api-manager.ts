/*!
 * Copyright 2019-2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { writeFileSync } from 'fs';
import { stat } from 'fs/promises';
import { Serializer as IniSerializer } from 'multi-ini';
import crypto from 'crypto';
import path from 'path';
import chokidar from 'chokidar';
import { EventEmitter } from 'events';
import toMillisecond from 'ms';
import { getProperty } from 'dot-prop';
import { Cache as MemoryCache } from 'clean-cache';
import { validate as validateArgument } from 'bycontract';
import { Mutex, MutexInterface } from 'async-mutex';
import { apiManagerLogger } from '@app/core/log';
import { MyServersConfig } from '@app/types/my-servers-config';
import { userCache } from '@app/cache/user';
import { loadState } from '@app/core/utils/misc/load-state';
import { validateApiKeyFormat } from '@app/core/utils/misc/validate-api-key-format';
import { validateApiKey } from '@app/core/utils/misc/validate-api-key';
import { getters } from '@app/store';

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

// Ini serializer
const serializer = new IniSerializer({
	// This ensures it ADDs quotes
	keep_quotes: false,
});

/**
 * Api manager
 */
export class ApiManager extends EventEmitter {
	private static instance: ApiManager;

	/** Note: Keys expire by default after 365 days. */
	private readonly keys = new MemoryCache<CacheItem>(Number(toMillisecond('1y')));

	private lock?: MutexInterface;

	constructor(options: Options = { watch: true }) {
		super({
			captureRejections: true,
		});

		// Return or create the singleton class
		if (ApiManager.instance) {
			// eslint-disable-next-line no-constructor-return
			return ApiManager.instance;
		}

		// Create singleton
		ApiManager.instance = this;

		// Get my server's config file path
		const configPath = process.env.PATHS_MY_SERVERS_CONFIG ?? '/boot/config/plugins/dynamix.my.servers/myservers.cfg' as const;

		// Load UPC + notifier keys
		apiManagerLogger.debug('Loading service API keys...');
		const myserversConfigFile = loadState<Partial<MyServersConfig>>(configPath);
		const upcApiKey = myserversConfigFile?.upc?.apikey;
		const notifierApiKey = myserversConfigFile?.notifier?.apikey;

		// If we have both keys just add them to the internal store
		if (upcApiKey && notifierApiKey) {
			// Update api manager with key
			this.replace('upc', upcApiKey, { userId: '-1' });
			this.replace('notifier', notifierApiKey, { userId: '-1' });
		} else {
			// Generate API keys
			const UPCFinalKey = upcApiKey ?? `unupc_${crypto.randomBytes(58).toString('hex')}`.substring(0, 64);
			const notifierFinalKey = notifierApiKey ?? `unnotify_${crypto.randomBytes(58).toString('hex')}`.substring(0, 64);

			// Rebuild config file
			const data: Partial<MyServersConfig> = {
				...myserversConfigFile,
				upc: {
					apikey: UPCFinalKey,
				},
				notifier: {
					apikey: notifierFinalKey,
				},
			};

			apiManagerLogger.debug('Dumping MyServers config back to file');

			// Stringify data
			const stringifiedData = serializer.serialize(data);

			// Update config file
			writeFileSync(configPath, stringifiedData);

			// Update api manager with key
			this.replace('upc', UPCFinalKey, { userId: '-1' });
			this.replace('notifier', notifierFinalKey, { userId: '-1' });
		}

		// Watch for changes to the myservers.cfg file
		// @todo Move API keys to their own file
		if (options.watch) {
			chokidar.watch(path.basename(configPath), {
				ignoreInitial: true,
			}).on('all', async (_eventName, filePath) => {
				if (filePath === configPath) {
					await this.checkKey(filePath);
				}
			});
		}

		// Load my_servers key
		apiManagerLogger.debug('Loading MyServers API key...');
		this.checkKey(configPath, true).then(isValid => {
			apiManagerLogger.debug(isValid ? 'Loaded MyServers API key, starting server with 1 key!' : 'API key is empty, starting server with no keys.');

			// API manager is ready
			this.emit('ready', undefined);
		}).catch(error => {
			apiManagerLogger.debug('Failing loading MyServers API key with %s', error);
		});
	}

	/**
	 * Replace a key.
	 *
	 * Note: This will bump the expiration by the original length.
	 */
	replace(name: string, key: string, options: KeyOptions = {}) {
		// Delete existing key
		// @ts-expect-error - null is not CacheItem<CacheItem>
		this.keys.items[name] = null;

		// Add new key
		this.add(name, key, options);

		// Emit update
		apiManagerLogger.trace('Emitting "replace" event');
		this.emit('replace', name, this.getKey(name));
	}

	/**
	 * Add a new key.
	 *
	 * Note: Keys expire by default after 365 days.
	 *
	 * @memberof ApiManager
	 */
	add(name: string, key: string, options: KeyOptions = {}): void {
		const { userId, expiration = '1y' } = options;

		validateArgument(name, 'string');
		validateArgument(key, 'string');
		validateArgument(expiration, 'string|number');

		const ttl = Number(toMillisecond(expiration));
		const keyObject = {
			name,
			key,
			userId,
		};

		// Add new key
		this.keys.add(name, keyObject, ttl);

		// Emit update
		apiManagerLogger.trace('Emitting "add" event');
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
					apiManagerLogger.debug('No key found for "%s".', nameOrKey);
					return false;
				}

				// We still have to use .get() after finding the key
				// as this will run the cache validation check
				// without this the key would be "valid" even after
				// it's over the cache time
				const key = this.keys.get(name);

				apiManagerLogger.trace('Key found for "%s".', name);

				return key !== null;
			} catch (error: unknown) {
				apiManagerLogger.debug(error);
				return false;
			}
		}

		apiManagerLogger.trace('Key found for "%s".', nameOrKey);
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
	getKey(name: string): CacheItem | undefined {
		validateArgument(name, 'string');
		return this.keys.get(name)!;
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

		// Don't emit event if the key has already expired
		// This is to prevent duplicate events
		if (this.keys.get(name) === null) {
			return;
		}

		// Invalidate the key
		apiManagerLogger.debug('Invalidating key %s', name);
		this.keys.invalidate(name);

		// Ensure the key is invalidated before we emit the event
		process.nextTick(() => {
			apiManagerLogger.trace('Emitting "expire" event for %s', name);
			this.emit('expire', name);
		});
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
				key: item.value.key,
				userId: item.value.userId,
				expiresAt: item.expiresAt,
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
			.find(([_, item]) => item.value.key === key);

		if (!keyObject) {
			throw new Error('No entry found for the provided API key.');
		}

		return keyObject[0];
	}

	async checkKey(filePath: string, force = false) {
		const lock = await this.getLock();
		// This will return a boolean is the key is valid or not
		// If if detects the key is invalid it'll ensure it's removed from the current API manager instance
		// If the key is valid we return
		return lock.runExclusive(async () => {
			apiManagerLogger.trace('Checking API key for validity.');

			const { paths } = getters.config();
			const myServersConfigPath = paths['myservers-config'];
			const configExists = (await stat(myServersConfigPath).catch(() => ({ size: 0 }))).size > 0;
			const clearKey = (reason: string) => {
				apiManagerLogger.trace(reason);

				// If we have an API key loaded then clear it
				if (this.cloudKey) {
					this.expire('my_servers');

					// Clear servers cache
					userCache.del('mine');
					apiManagerLogger.debug('Cleared "my_servers" API key from manager.');
				}

				return false;
			};

			try {
				// Check if the myservers.cfg exists
				if (!configExists) return clearKey(`File is missing "${myServersConfigPath}"`);

				// Load the myservers.cfg
				const file = loadState<{ remote: { apikey: string } }>(filePath);
				if (!file) return clearKey(`File is missing "${myServersConfigPath}"`);

				// Get the user's API key
				const apiKey: string | undefined = getProperty(file, 'remote.apikey');

				// Check if the API key we loaded from the config is empty
				if (apiKey === undefined || (typeof apiKey === 'string' && apiKey.trim() === '')) return clearKey('API key is missing.');

				// Check if the current loaded API key is the same as the one from the config
				if (!force && (apiKey === this.cloudKey)) {
					apiManagerLogger.debug('%s was updated but the API key didn\'t change.', filePath);
					return true;
				}

				// Check if the key format is valid
				const validFormat = validateApiKeyFormat(apiKey, false);
				if (!validFormat) return clearKey('API key is corrupted.');
				apiManagerLogger.trace('API key is in the correct format, checking key\'s validity with key-server');

				// Check if the key is valid with key-server
				const isValid = await validateApiKey(apiKey, false);
				if (!isValid) return clearKey('Key-server marked this API key as invalid.');
				apiManagerLogger.debug('Key-server marked this API key as valid.');

				// If everything looks good then replace whatever the current key is in API manager
				// If there's no key it'll set it otherwise it'll override the old one
				this.replace('my_servers', apiKey, {
					userId: '-1',
				});

				// Key is valid
				return true;
			} catch (error: unknown) {
				// Log the error in trace
				apiManagerLogger.trace(error);

				if (!configExists) {
					// File was deleted
					apiManagerLogger.debug(`Removing "my_servers" API key as "${myServersConfigPath}" was deleted.`);
				}

				// Something happened?
				apiManagerLogger.addContext('error', error);
				apiManagerLogger.debug('Removing "my_servers" API key as we had an error while checking the key.');
				apiManagerLogger.removeContext('error');

				// Reset key as it's not valid anymore
				this.expire('my_servers');

				return false;
			}
		});
	}

	private async getLock() {
		this.lock ??= new Mutex();
		return this.lock;
	}

	get cloudKey() {
		return this.getKey('my_servers')?.key;
	}
}

export const apiManager = new ApiManager();
