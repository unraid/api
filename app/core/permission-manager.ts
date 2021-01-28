/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

// @ts-expect-error
import { validate as validateArgument } from 'bycontract';
import { LooseObject } from './types';
import { AppError } from './errors';

/**
 * Permission manager.
 */
class PermissionManager {
	private knownScopes: string[];
	private scopes: LooseObject;

	/**
	 * @hideconstructor
	 */
	constructor() {
		/**
		 * Scopes that've been registered
		 *
		 * @name PermissionManager.knownScopes
		 */
		this.knownScopes = [];

		/**
		 * Keys and what scopes are linked to them.
		 *
		 * Note: If this key is linked to a user it'll extend their scopes.
		 *
		 * @name PermissionManager.scopes
		 */
		this.scopes = {};
	}

	/**
	 * Get scopes based on name or fall back to all scopes
	 *
	 * @param apiKey The API key to lookup.
	 * @memberof PermissionManager
	 */
	getScopes(apiKey: string) {
		if (!apiKey) {
			return this.knownScopes;
		}

		validateArgument(apiKey, 'string');

		if (!Object.keys(this.scopes).includes(apiKey)) {
			throw new AppError('Invalid key!');
		}

		return this.scopes[apiKey];
	}

	/**
	 * Register a plugin.
	 *
	 * @param pluginName Name of the plugin to register.
	 * @param scopes Additional permissions scopes to add to the API key.
	 */
	registerPlugin(pluginName: string, scopes: LooseObject = {}): void {
		validateArgument(pluginName, 'string');
		validateArgument(scopes, 'object');

		const scopeObject = {
			...Object.keys(this.scopes).includes(pluginName) && this.scopes[pluginName],
			...scopes
		};

		// Update the known list of valid scopes
		// @ts-expect-error
		this.knownScopes = [
			...this.knownScopes,
			...Object.values(scopeObject)
		];

		// Update the current scopes
		this.scopes = {
			...this.scopes,
			...scopeObject
		};
	}
}

export const permissionManager = new PermissionManager();
