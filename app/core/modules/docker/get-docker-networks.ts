/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import camelCaseKeys from 'camelcase-keys';
import { docker, catchHandlers, ensurePermission } from '../../utils';
import { CoreContext, CoreResult } from '../../types';

export const getDockerNetworks = async (context: CoreContext): Promise<CoreResult> => {
	const { user } = context;

	// Check permissions
	ensurePermission(user, {
		resource: 'docker/network',
		action: 'read',
		possession: 'any'
	});

	const networks = await docker.listNetworks()
		// If docker throws an error return no networks
		.catch(catchHandlers.docker)
		.then((networks = []) => {
			return networks.map(object => camelCaseKeys(object, { deep: true }));
		});

	/**
	 * Get all Docker networks
	 *
	 * @memberof Core
	 * @module docker/get-networks
	 * @param {Core~Context} context
	 * @returns {Core~Result} All the in/active Docker networks on the system.
	 */
	return {
		text: `Networks: ${JSON.stringify(networks, null, 2)}`,
		json: networks
	};
};
