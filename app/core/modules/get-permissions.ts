/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { ac } from '../permissions';
import { ensurePermission, getPermissions as getUserPermissions } from '../utils';
import { CoreContext, CoreResult } from '../types';

/**
 * Get all permissions.
 */
export const getPermissions = async function (context: CoreContext): Promise<CoreResult> {
	const { user } = context;

	// Bail if the user doesn't have permission
	ensurePermission(user, {
		resource: 'permission',
		action: 'read',
		possession: 'any'
	});

	// Get all scopes
	const scopes = Object.assign({}, ...Object.values(ac.getGrants()).map(grant => {
		// @ts-expect-error
		const { $extend, ...grants } = grant;
		return {
			...grants,
			...$extend && getUserPermissions($extend)
		};
	}));

	// Get all roles and their scopes
	const grants = Object.entries(ac.getGrants())
		.map(([name, grant]) => {
			// @ts-expect-error
			const { $extend, ...grants } = grant;
			return [name, grants];
		})
		.reduce((object, {
			0: key,
			1: value
		}) => Object.assign(object, {
			[key.toString()]: value
		}), {});

	return {
		text: `Scopes: ${JSON.stringify(scopes, null, 2)}`,
		json: {
			scopes,
			grants
		}
	};
};
