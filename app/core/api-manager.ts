/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import fs from 'fs';
import { Serializer as IniSerializer } from 'multi-ini';
import crypto from 'crypto';
import path from 'path';
import chokidar from 'chokidar';
import { EventEmitter } from 'events';
import toMillisecond from 'ms';
import dotProp from 'dot-prop';
import { Cache as MemoryCache } from 'clean-cache';
import { validate as validateArgument } from 'bycontract';
import { Mutex, MutexInterface } from 'async-mutex';
import { validateApiKeyFormat, loadState, validateApiKey, isNodeError } from './utils';
import { paths } from './paths';
import { apiManagerLogger } from './log';
import { MyServersConfig } from '../types/my-servers-config';

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
	keep_quotes: false
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
			captureRejections: true
		});

		// Return or create the singleton class
		if (ApiManager.instance) {
			// eslint-disable-next-line no-constructor-return
			return ApiManager.instance;
		}

		// Create singleton
		ApiManager.instance = this;

		// Get my server's config file path
		const configPath = paths.get('myservers-config')!;

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
					apikey: UPCFinalKey
				},
				notifier: {
					apikey: notifierFinalKey
				}
			};

			apiManagerLogger.debug('Dumping MyServers config back to file');

			// Stringify data
			const stringifiedData = serializer.serialize(data);

			// Update config file
			fs.writeFileSync(configPath, stringifiedData);

			// Update api manager with key
			this.replace('upc', UPCFinalKey, { userId: '-1' });
			this.replace('notifier', notifierFinalKey, { userId: '-1' });
		}

		// Watch for changes to the myservers.cfg file
		// @todo Move API keys to their own file
		if (options.watch) {
			chokidar.watch(path.basename(configPath), {
				ignoreInitial: true
			}).on('all', async (_eventName, filePath) => {
				if (filePath === configPath) {
					await this.checkKey(filePath);
				}
			});
		}

		// Load my_servers key
		apiManagerLogger.debug('Loading MyServers API key...');
		this.checkKey(configPath, true).then(() => {
			apiManagerLogger.debug('Loaded MyServers API key!');

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
	replace(name: string, key: string, options: KeyOptions) {
		// Delete existing key
		// @ts-expect-error
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

		// Don't emit event if the key has already expired
		// This is to prevent duplicate events
		if (this.keys.get(name) === null) {
			return;
		}

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
			.find(([_, item]) => item.value.key === key);

		if (!keyObject) {
			throw new Error('No entry found for the provided API key.');
		}

		return keyObject[0];
	}

	async checkKey(filePath: string, force = false) {
		const lock = await this.getLock();
		await lock.runExclusive(async () => {
			apiManagerLogger.trace('Checking API key for validity.');
			const file = loadState<{ remote: { apikey: string } }>(filePath);
			const apiKey: string | undefined = dotProp.get(file, 'remote.apikey');

			// No API key passed
			if (apiKey === undefined) {
				return;
			}

			// Same key as current
			if (!force && (apiKey === this.getKey('my_servers')?.key)) {
				apiManagerLogger.debug('%s was updated but the API key didn\'t change.', filePath);
				return;
			}

			// Ensure key format is valid before validating
			validateApiKeyFormat(apiKey);
			apiManagerLogger.trace('API key is in the correct format, checking key\'s validity...');

			// Ensure key is valid before connecting
			await validateApiKey(apiKey);
			apiManagerLogger.debug('API key is valid.');

			// Add the new key
			this.replace('my_servers', apiKey, {
				userId: '-1'
			});
		}).catch(error => {
			if (isNodeError(error)) {
				// File was deleted
				if (error?.code === 'ENOENT') {
					apiManagerLogger.debug('%s was deleted, removing "my_servers" API key.', filePath);
				} else {
					apiManagerLogger.debug('%s, removing "my_servers" API key.', error.message);
				}
			} else {
				apiManagerLogger.debug('%s, removing "my_servers" API key.', error.message);
			}

			// Reset key as it's not valid anymore
			this.expire('my_servers');
		});
	}

	private async getLock() {
		this.lock ??= new Mutex();
		return this.lock;
	}
}

export const apiManager = new ApiManager();
