/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import toMillisecond from 'ms';
import { Cache as MemoryCache } from 'clean-cache';
// @ts-ignore
import { validate as validateArgument } from 'bycontract';

export interface CacheItem {
	/** Machine readable name of the key. */
	name: string;
	/** Owner's id */
	userId: string;
	/** The API key. */
	key: string | number;
	/** When the key will expire in human readable form. This will be converted internally to ms. */
	expiration: string;
}

export interface AddOptions {
	/** Owner's id */
	userId?: string;
	/** When the key will expire in human readable form. This will be converted internally to ms. */
	expiration?: string;
}

interface ApiKey {
	name: string;
	key: string | number;
	userId: string;
	expiresAt: number;
}

/**
 * Api manager
 */
export class ApiManager {
	private static instance: ApiManager;

	/** Note: Keys expire by default after 365 days. */
	private readonly keys = new MemoryCache<CacheItem>(Number(toMillisecond('1y')));

	constructor() {
		if (ApiManager.instance) {
			// This is needed as this is a singleton class
			// @eslint-disable-next-line no-constructor-return
			return ApiManager.instance;
		}

		ApiManager.instance = this;
	}

	/**
	 * Add a new key.
	 *
	 * Note: Keys expire by default after 365 days.
	 *
	 * @memberof ApiManager
	 */
	add(name: string, key: string|number, options: AddOptions): void {
		const { userId, expiration = '1y' } = options;

		validateArgument(name, 'string');
		validateArgument(key, 'string|number');
		validateArgument(expiration, 'string|number');

		const ttl = Number(toMillisecond(expiration));

		this.keys.add(name, {
			name,
			key,
			userId
		}, ttl);
	}

	/**
	 * Is valid based on "name and key" or just "key".
	 *
	 * @param nameOrKey The name or key of the API key.
	 * @param key The API key.
	 * @returns `true` if the key is valid, otherwise `false`.
	 * @memberof ApiManager
	 */
	isValid(nameOrKey: string|number, key?: string|number): boolean {
		validateArgument(nameOrKey, 'string|number');
		validateArgument(key, 'string|number|undefined');

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
	getNameFromKey(key: string|number): string {
		validateArgument(key, 'string|number');

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
