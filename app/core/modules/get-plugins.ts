/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { CoreContext, CoreResult } from '../types';
import { ParamInvalidError } from '../errors';
import { pluginManager } from '../plugin-manager';
import { ensurePermission } from '../utils';
import { Plugin } from '../plugin-manager';

interface Context extends CoreContext {
	readonly query: {
		readonly filter: string;
	};
}

interface Result extends CoreResult {
	json: Plugin[]
}

export const getPlugins = (context: Readonly<Context>): Result => {
	const { user } = context;

	// Check permissions
	ensurePermission(user, {
		resource: 'plugin',
		action: 'read',
		possession: 'any'
	});

	const { query } = context;
	const { filter = 'all' } = query;

	if (!['all', 'active', 'inactive'].includes(filter)) {
		throw new ParamInvalidError('filter', filter);
	}

	const plugins = pluginManager.getAllPlugins().map(plugin => {
		// Plugin is likely disabled
		if (!plugin.modules) {
			return plugin;
		}

		// Get modules with names
		const modules = Object.entries(plugin.modules).map(([name, value]) => {
			return {
				name,
				...value
			};
		});
		return {
			...plugin,
			modules
		};
	});

	const title: string = {
		all: 'Plugins',
		active: 'Active',
		inactive: 'InActive'
	}[filter];

	const json = {
		all: () => plugins,
		active: () => plugins.filter(({ isActive }) => isActive),
		inactive: () => plugins.filter(({ isActive }) => !isActive)
	}[filter]();
	const names = json.map(({ name }) => name);

	/**
	 * Get all plugins
	 *
	 * @memberof Core
	 * @module get-plugins
	 * @param {Core~Context} context
	 * @param {Object} [context.query = {}]
	 * @param {'all' | 'active' | 'inactive'} [context.query.filter = 'all']
	 * @returns {Core~Result}
	 */
	return {
		text: `${title}: ${JSON.stringify(names, null, 2)}`,
		json
	};
};
