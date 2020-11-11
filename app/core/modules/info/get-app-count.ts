/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { CoreResult, CoreContext } from '../../types';
import { docker, ensurePermission } from '../../utils';

/**
 * Two arrays containing the installed and started containers.
 *
 * @param installed The amount of installed containers.
 * @param started The amount of running containers.
 * @interface Result
 * @extends {CoreResult}
 */
interface Result extends CoreResult {
	json: {
		installed: number;
		started: number;
	};
}

/**
 * Get count of docker containers
 */
export const getAppCount = async function(context: Readonly<CoreContext>): Promise<Result> {
	const { user } = context;

	// Check permissions
	ensurePermission(user, {
		resource: 'docker/container',
		action: 'read',
		possession: 'any'
	});

	const installed = await docker.listContainers({ all: true }).catch(() => []).then(containers => containers.length);
	const started = await docker.listContainers().catch(() => []).then(containers => containers.length);

	return {
		text: `Installed: ${installed} \nStarted: ${started}`,
		json: {
			installed,
			started
		}
	};
};
