import fs from 'fs';

import camelCaseKeys from 'camelcase-keys';
import { ContainerInfo } from 'dockerode';

import type { ContainerPort, Docker, DockerContainer } from '@app/graphql/generated/api/types.js';
import { dockerLogger } from '@app/core/log.js';
import { docker } from '@app/core/utils/clients/docker.js';
import { catchHandlers } from '@app/core/utils/misc/catch-handlers.js';
import { ContainerPortType, ContainerState } from '@app/graphql/generated/api/types.js';
import { getters, store } from '@app/store/index.js';
import { updateDockerState } from '@app/store/modules/docker.js';

/**
 * Get all Docker containers.
 * @returns All the in/active Docker containers on the system.
 */

export const getDockerContainers = async (
    { useCache } = { useCache: true }
): Promise<Array<DockerContainer>> => {
    const dockerState = getters.docker();
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
        // If docker throws an error return no containers
        .catch(catchHandlers.docker);

    // Cleanup container object
    const containers: Array<DockerContainer> = rawContainers.map((container) => {
        const names = container.Names[0];
        const containerData: DockerContainer = camelCaseKeys<DockerContainer>(
            {
                labels: container.Labels ?? {},
                sizeRootFs: undefined,
                imageId: container.ImageID,
                state:
                    typeof container.State === 'string'
                        ? (ContainerState[container.State.toUpperCase()] ?? ContainerState.EXITED)
                        : ContainerState.EXITED,
                autoStart: autoStarts.includes(names.split('/')[1]),
                ports: container.Ports.map<ContainerPort>((port) => ({
                    ...port,
                    type: ContainerPortType[port.Type.toUpperCase()],
                })),
                command: container.Command,
                created: container.Created,
                mounts: container.Mounts,
                networkSettings: container.NetworkSettings,
                hostConfig: {
                    networkMode: container.HostConfig.NetworkMode,
                },
                id: container.Id,
                image: container.Image,
                status: container.Status,
            },
            { deep: true }
        );
        return containerData;
    });

    // Get all of the current containers
    const installed = containers.length;
    const running = containers.filter((container) => container.state === ContainerState.RUNNING).length;

    store.dispatch(updateDockerState({ containers, installed, running }));
    return containers;
};
