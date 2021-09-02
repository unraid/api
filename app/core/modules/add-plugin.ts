/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import path from 'node:path';
import packageJson from 'package-json';
import dlTgz from 'dl-tgz';
import observableToPromise from 'observable-to-promise';
import { CoreContext, CoreResult } from '../types';
import { AppError, FieldMissingError } from '../errors';
import { hasFields, ensurePermission } from '../utils';
import { paths } from '../paths';

interface Context extends CoreContext {
	data: {
		/** Plugin's npm name. */
		name: string;
		/** Plugin's version. */
		version: string;
	};
}

/**
 * Install plugin.
 * @returns The newly installed plugin.
 */
export const addPlugin = async (context: Context): Promise<CoreResult> => {
	// Check permissions
	ensurePermission(context.user, {
		resource: 'plugin',
		action: 'create',
		possession: 'any'
	});

	// Validation
	const missingFields = hasFields(context.data, ['name']);
	if (missingFields.length > 0) {
		// Log first error.
		throw new FieldMissingError(missingFields[0]);
	}

	// Get package metadata
	const { name, version } = context.data;
	const package_ = await packageJson(name, {
		allVersions: Boolean(version)
	});

	// Plugin tgz url
	const latest = package_.versions[version];
	const url = latest.dist.tarball;
	const pluginCwd = paths.get('plugins')!;

	// Download tgz to plugin dir
	await observableToPromise(dlTgz(url, path.join(pluginCwd, name))).catch(() => {
		throw new AppError(`Plugin download failed for "${name}".`);
	});

	// Register plugin with manager

	// Run plugin init

	return {
		text: 'Plugin added successfully.',
		json: {
			pkg: package_
		}
	};
};
