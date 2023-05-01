/*!
 * Copyright 2019-2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import fs from 'fs';
import camelCaseKeys from 'camelcase-keys';
import { catchHandlers } from '@app/core/utils/misc/catch-handlers';
import { getters, store } from '@app/store';
import { updateDockerState } from '@app/store/modules/docker'

import {
    type ContainerPort,
    ContainerPortType,
    type DockerContainer,
    ContainerState,
} from '@app/graphql/generated/api/types';
import { dockerLogger } from '@app/core/log';
import { docker } from '@app/core/utils/clients/docker';

/**
 * Get all Docker containers.
 * @returns All the in/active Docker containers on the system.
 */

export const getDockerContainers = async (
    { useCache } = { useCache: true }
): Promise<Array<DockerContainer>> => {
    const dockerState = getters.docker()
    if (useCache && dockerState.containers) {
        dockerLogger.trace('Using docker container cache');
        return dockerState.containers;
    }

    dockerLogger.trace('Skipping docker container cache');

    /**
     * Docker auto start file
     *
     * @note Doesn't exist if array is offline.
     * @see https://github.com/limetech/webgui/issues/502#issue-480992547
     */
    const autoStartFile = await fs.promises
        .readFile(getters.paths()['docker-autostart'], 'utf8')
        .then((file) => file.toString())
        .catch(() => '');
    const autoStarts = autoStartFile.split('\n');
    const rawContainers = await docker
        .listContainers({
            all: true,
            size: true,
        })
        .then((containers) =>
            containers.map((object) => camelCaseKeys(object, { deep: true }))
        )
        // If docker throws an error return no containers
        .catch(catchHandlers.docker);

    // Cleanup container object
    const containers: Array<DockerContainer> = rawContainers.map<DockerContainer>(
        (container) => {
            const names = container.names[0];
            const containerData: DockerContainer = {
                ...container,
                labels: container.labels,
                // @ts-expect-error sizeRootFs is not on the dockerode type, but is fetched when size: true is set
                sizeRootFs: container.sizeRootFs ?? undefined,
                imageId: container.imageID,
                state:
                    typeof container?.state === 'string'
                        ? ContainerState[container.state.toUpperCase()] ??
                          ContainerState.EXITED
                        : ContainerState.EXITED,
                autoStart: autoStarts.includes(names.split('/')[1]),
                ports: container.ports.map<ContainerPort>((port) => ({
                    ...port,
                    type: ContainerPortType[port.type.toUpperCase()],
                })),
            };
            return containerData;
        }
    );

    // Get all of the current containers
    const installed = containers.length;
    const running = containers.filter(
        (container) => container.state === ContainerState.RUNNING
    ).length;

    store.dispatch(updateDockerState({ containers, installed, running }))
    return containers;
};
