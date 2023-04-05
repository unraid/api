/*!
 * Copyright 2019-2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import fs from 'fs';
import camelCaseKeys from 'camelcase-keys';
import { ensurePermission } from '@app/core/utils/permissions/ensure-permission';
import { catchHandlers } from '@app/core/utils/misc/catch-handlers';
import { docker } from '@app/core/utils/clients/docker';
import { getters } from '@app/store';
import { type ContainerPort, ContainerPortType, type DockerContainer, type QueryResolvers, ContainerState } from '@app/graphql/generated/api/types';

/**
 * Get all Docker containers.
 * @returns All the in/active Docker containers on the system.
 */
export const getDockerContainers: QueryResolvers['dockerContainers'] = async (_, __, context) => {
	const { user } = context;

	// Check permissions
	ensurePermission(user, {
		resource: 'docker/container',
		action: 'read',
		possession: 'any',
	});

	/**
     * Docker auto start file
     *
     * @note Doesn't exist if array is offline.
     * @see https://github.com/limetech/webgui/issues/502#issue-480992547
     */
	const autoStartFile = await fs.promises.readFile(getters.paths()['docker-autostart'], 'utf8').then(file => file.toString()).catch(() => '');
	const autoStarts = autoStartFile.split('\n');
	const containers = await docker
		.listContainers({
			all: true,
			size: true,
		})
		.then(containers => containers.map(object => camelCaseKeys(object, { deep: true })))
		// If docker throws an error return no containers
		.catch(catchHandlers.docker);

	// Cleanup container object
	const result: Array<DockerContainer> = containers
		.map<DockerContainer>(container => {
			const names = container.names[0];
			return {
				...container,
				labels: container.labels,
				// @ts-expect-error sizeRootFs is not on the dockerode type, but is fetched when size: true is set
				sizeRootFs: container.sizeRootFs ?? undefined,
				imageId: container.imageID,
				state: typeof container.state === 'string' ? ContainerState[container.state.toUpperCase()] : ContainerState.EXITED,
				autoStart: autoStarts.includes(names.split('/')[1]),
				ports: container.ports.map<ContainerPort>(port => ({
					...port,
					type: ContainerPortType[port.type.toUpperCase()]
				}))
			};
		});

	return result;
};
