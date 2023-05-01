/*!
 * Copyright 2019-2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import fs from 'fs';
import camelCaseKeys from 'camelcase-keys';
import { catchHandlers } from '@app/core/utils/misc/catch-handlers';
import { docker } from '@app/core/utils/clients/docker';
import { getters } from '@app/store';
import {
    type ContainerPort,
    ContainerPortType,
    type DockerContainer,
    ContainerState,
} from '@app/graphql/generated/api/types';
import { dockerLogger } from '@app/core/log';

let containerCache: Array<DockerContainer> | null = null;
/**
 * Get all Docker containers.
 * @returns All the in/active Docker containers on the system.
 */

export const getDockerContainers = async (
    { useCache } = { useCache: true }
): Promise<Array<DockerContainer>> => {
    if (useCache && containerCache) {
        dockerLogger.trace('Using docker container cache');
        return containerCache;
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
    const containers = await docker
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
    const result: Array<DockerContainer> = containers.map<DockerContainer>(
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

    containerCache = result;
    return result;
};
