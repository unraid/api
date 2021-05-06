/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import fs from 'fs';
import ini from 'ini';
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
import { apiManagerLogger, log } from './log';

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

		const configPath = paths.get('myservers-config')!;

		// Create UPC key
		const file = loadState<{ upc: { apikey: string } }>(configPath);
		const upcApiKey = dotProp.get(file, 'upc.apikey')! as string;
		if (!upcApiKey) {
			// Generate api key
			const apiKey = `unupc_${crypto.randomBytes(58).toString('hex').substring(0, 58)}`;
			// Set api key
			file.upc = {
				apikey: apiKey
			};
			// Update config file
			fs.writeFileSync(configPath, ini.stringify(file));
			// Update api manager with key
			this.replace('upc', apiKey, {
				// @todo: fix UPC being root
				userId: '0'
			});
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
		log.debug('Loading MyServers API key...');
		this.checkKey(configPath, true).then(() => {
			log.debug('Loaded MyServers API key!');

			// API manager is ready
			this.emit('ready', undefined);
		}).catch(error => {
			log.debug('Failing loading MyServers API key with %s', error);
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
		log.debug('Emitting "replace" event');
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
		log.debug('Emitting "add" event');
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
			apiManagerLogger.debug('Checking API key for validity.');
			const file = loadState<{ remote: { apikey: string } }>(filePath);
			const apiKey = dotProp.get(file, 'remote.apikey')! as string;

			// Same key as current
			if (!force && (apiKey === this.getKey('my_servers')?.key)) {
				apiManagerLogger.debug('%s was updated but the API key didn\'t change', filePath);
				return;
			}

			// Ensure key format is valid before validating
			validateApiKeyFormat(apiKey);
			apiManagerLogger.debug('API key is in the correct format, checking key\'s validity...');

			// Ensure key is valid before connecting
			await validateApiKey(apiKey);
			apiManagerLogger.debug('API key is valid.');

			// Add the new key
			this.replace('my_servers', apiKey, {
				userId: '0'
			});
		}).catch(error => {
			if (isNodeError(error)) {
				// File was deleted
				if (error?.code === 'ENOENT') {
					apiManagerLogger.debug('%s was deleted, removing "my_servers" API key.', filePath);
				} else {
					apiManagerLogger.debug('%s, removing "my_servers" API key.', error.message);
				}
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
