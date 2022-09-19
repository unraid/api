/*!
 * Copyright 2019-2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { Cache } from 'clean-cache';

export const caches = new Map<string, Cache>();

// In seconds
const ONE_MINUTE = 60 * 1_000;

/**
 * Cache manager.
 */
export class CacheManager {
	ttl: number;

	constructor(private readonly name: string, ttl: number = ONE_MINUTE) {
		// Get cache
		let cache = caches.get(name);

		this.ttl = ttl;

		// Create new cache if we can't find one
		if (!cache) {
			cache = new Cache(ttl);
			caches.set(name, cache);
		}
	}

	get<T>(key: string): T {
		return caches.get(this.name)?.get(key);
	}

	set<T = undefined>(key: string, value: T, ttl?: number): T {
		// Get cache
		const cache = caches.get(this.name);

		// Check for existing entry and return that
		const item: T = cache?.get(key);
		if (item) {
			return item;
		}

		// Update cache
		// @ts-expect-error Todo fix the value type here when refactored to global store
		cache?.add(key, value, ttl ?? this.ttl ?? ONE_MINUTE);
		return value;
	}

	keys(): string[] {
		return [...caches.keys()];
	}
}
