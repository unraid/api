import { validate as validateArgument } from 'bycontract';
import { type LooseObject } from '@app/core/types';
import { AppError } from '@app/core/errors/app-error';

/**
 * Permission manager.
 */
class PermissionManager {
	private readonly knownScopes: string[];
	private readonly scopes: LooseObject;

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
}

export const permissionManager = new PermissionManager();
