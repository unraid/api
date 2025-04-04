import { promises as fs } from 'fs';

import camelCaseKeys from 'camelcase-keys';

import type { ContainerPort, Docker, DockerContainer } from '@app/graphql/generated/api/types.js';
import { dockerLogger } from '@app/core/log.js';
import { docker } from '@app/core/utils/clients/docker.js';
import { catchHandlers } from '@app/core/utils/misc/catch-handlers.js';
import { ContainerPortType, ContainerState } from '@app/graphql/generated/api/types.js';
import { getters, store } from '@app/store/index.js';
import { updateDockerState } from '@app/store/modules/docker.js';
import { PathsConfig } from '../../../config/paths.config.js';

export interface ContainerListingOptions {
    useCache?: boolean;
}

/**
 * Get all Docker containers.
 * @returns All the in/active Docker containers on the system.
 */
export const getDockerContainers = async ({ useCache = true }: ContainerListingOptions = {}): Promise<DockerContainer[]> => {
    const dockerState = getters.docker();
    if (useCache && dockerState.containers) {
        dockerLogger.trace('Using docker container cache');
        return dockerState.containers;
    }

    dockerLogger.trace('Skipping docker container cache');

    const paths = PathsConfig.getInstance();
    const autostartFile = await fs.readFile(paths.dockerAutostart, 'utf8').catch(() => '');
    const autoStarts = autostartFile.split('\n');
    const rawContainers = await docker.listContainers({ all: true }).catch(catchHandlers.docker);

    const containers: DockerContainer[] = rawContainers.map((container) => ({
        id: container.Id,
        image: container.Image,
        imageId: container.ImageID,
        command: container.Command,
        created: container.Created,
        state: ContainerState[container.State.toUpperCase() as keyof typeof ContainerState],
        status: container.Status,
        ports: container.Ports.map((port) => ({
            ...port,
            type: ContainerPortType[port.Type.toUpperCase() as keyof typeof ContainerPortType],
        })) as ContainerPort[],
        autoStart: autoStarts.includes(container.Names[0].split('/')[1]),
        labels: container.Labels ?? {},
        mounts: container.Mounts,
        networkSettings: container.NetworkSettings,
        hostConfig: {
            networkMode: container.HostConfig.NetworkMode,
        },
    }));

    // Get all of the current containers
    const installed = containers.length;
    const running = containers.filter((container) => container.state === ContainerState.RUNNING).length;

    store.dispatch(updateDockerState({ containers, installed, running }));
    return containers;
};
