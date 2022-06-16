/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import fs from 'fs';
import camelCaseKeys from 'camelcase-keys';
import { paths } from '@app/core/paths';
import { ensurePermission } from '@app/core/utils/permissions/ensure-permission';
import type { CoreContext, CoreResult } from '@app/core/types';
import { catchHandlers } from '@app/core/utils/misc/catch-handlers';
import { docker } from '@app/core/utils/clients/docker';

interface Context extends CoreContext {
	readonly query: {
		readonly all: string;
	};
}

/**
 * Get all Docker containers.
 * @returns All the in/active Docker containers on the system.
 */
export const getDockerContainers = async (context: Context): Promise<CoreResult> => {
	const { query, user } = context;
	const { all } = query;

	// Check permissions
	ensurePermission(user, {
		resource: 'docker/container',
		action: 'read',
		possession: 'any'
	});

	/**
     * Docker auto start file
     *
     * @note Doesn't exist if array is offline.
     * @see https://github.com/limetech/webgui/issues/502#issue-480992547
     */
	const autoStartFile = await fs.promises.readFile(paths['docker-autostart'], 'utf8').then(file => file.toString()).catch(() => '');
	const autoStarts = autoStartFile.split('\n');
	const containers = await docker
		.listContainers({
			all: Boolean(all),
			size: true
		})
		.then(containers => containers.map(object => camelCaseKeys(object, { deep: true })))
		// If docker throws an error return no containers
		.catch(catchHandlers.docker);

	// Cleanup container object
	const result = containers
		.map(object => camelCaseKeys(object, { deep: true }))
		.map(container => {
			const names = container.names[0];
			return {
				...container,
				autoStart: autoStarts.includes(names.split('/')[1])
			};
		});

	return {
		text: `Containers: ${JSON.stringify(result, null, 2)}`,
		json: result
	};
};
