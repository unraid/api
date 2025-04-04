import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { readFile } from 'fs/promises';

import camelCaseKeys from 'camelcase-keys';
import Docker from 'dockerode';
import { debounce } from 'lodash-es';

import type { ContainerPort, DockerContainer, DockerNetwork } from '@app/graphql/generated/api/types.js';
import { pubsub, PUBSUB_CHANNEL } from '@app/core/pubsub.js';
import { catchHandlers } from '@app/core/utils/misc/catch-handlers.js';
import { sleep } from '@app/core/utils/misc/sleep.js';
import { ContainerPortType, ContainerState } from '@app/graphql/generated/api/types.js';
import { getters } from '@app/store/index.js';

interface ContainerListingOptions extends Docker.ContainerListOptions {
    useCache: boolean;
}

interface NetworkListingOptions {
    useCache: boolean;
}

@Injectable()
export class DockerService implements OnModuleInit {
    private client: Docker;
    private containerCache: Array<DockerContainer> = [];
    private autoStarts: string[] = [];
    private readonly logger = new Logger(DockerService.name);

    constructor() {
        this.client = this.getDockerClient();
    }

    public getDockerClient() {
        return new Docker({
            socketPath: '/var/run/docker.sock',
        });
    }

    get installed() {
        return this.containerCache.length;
    }

    get running() {
        return this.containerCache.filter((container) => container.state === ContainerState.RUNNING)
            .length;
    }

    get appUpdateEvent() {
        return {
            info: {
                apps: { installed: this.installed, running: this.running },
            },
        };
    }

    public async onModuleInit() {
        await this.debouncedContainerCacheUpdate();
    }

    /**
     * Docker auto start file
     *
     * @note Doesn't exist if array is offline.
     * @see https://github.com/limetech/webgui/issues/502#issue-480992547
     */
    public async getAutoStarts(): Promise<string[]> {
        const autoStartFile = await readFile(getters.paths()['docker-autostart'], 'utf8')
            .then((file) => file.toString())
            .catch(() => '');
        return autoStartFile.split('\n');
    }

    public debouncedContainerCacheUpdate = debounce(async () => {
        await this.getContainers({ useCache: false });
        await pubsub.publish(PUBSUB_CHANNEL.INFO, this.appUpdateEvent);
    }, 500);

    public transformContainer(container: Docker.ContainerInfo): DockerContainer {
        return camelCaseKeys<DockerContainer>(
            {
                names: container.Names,
                labels: container.Labels ?? {},
                sizeRootFs: undefined,
                imageId: container.ImageID,
                state:
                    typeof container.State === 'string'
                        ? (ContainerState[container.State.toUpperCase()] ?? ContainerState.EXITED)
                        : ContainerState.EXITED,
                autoStart: this.autoStarts.includes(container.Names[0].split('/')[1]),
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
    }

    public async getContainers(
        {
            useCache = false,
            all = true,
            size = true,
            ...listOptions
        }: Partial<ContainerListingOptions> = { useCache: false }
    ): Promise<DockerContainer[]> {
        if (useCache && this.containerCache.length > 0) {
            this.logger.debug('Using docker container cache');
            return this.containerCache;
        }

        this.logger.debug('Updating docker container cache');
        const rawContainers = await this.client
            .listContainers({
                all,
                size,
                ...listOptions,
            })
            // If docker throws an error return no containers
            .catch(catchHandlers.docker);
        this.autoStarts = await this.getAutoStarts();
        // Cleanup container object
        this.containerCache = rawContainers.map((container) => {
            const containerData: DockerContainer = this.transformContainer(container);
            return containerData;
        });
        return this.containerCache;
    }

    /**
     * Get all Docker networks
     * @todo filtering / cache / proper typing
     * @returns All the in/active Docker networks on the system.
     */
    public async getNetworks({ useCache }: NetworkListingOptions): Promise<DockerNetwork[]> {
        return this.client
            .listNetworks()
            .catch(catchHandlers.docker)
            .then(
                (networks = []) =>
                    networks.map((object) =>
                        camelCaseKeys(object as unknown as Record<string, unknown>, { deep: true })
                    ) as DockerNetwork[]
            );
    }

    public async start(id: string): Promise<DockerContainer> {
        const container = this.client.getContainer(id);
        await container.start();
        const containers = await this.getContainers({ useCache: false });
        const updatedContainer = containers.find((c) => c.id === id);
        if (!updatedContainer) {
            throw new Error(`Container ${id} not found after starting`);
        }
        return updatedContainer;
    }

    public async stop(id: string): Promise<DockerContainer> {
        const container = this.client.getContainer(id);
        await container.stop({ t: 10 });
        let containers = await this.getContainers({ useCache: false });
        let updatedContainer: DockerContainer | undefined;
        for (let i = 0; i < 5; i++) {
            await sleep(500);
            // Refresh the containers list on each attempt
            containers = await this.getContainers({ useCache: false });
            updatedContainer = containers.find((c) => c.id === id);
            this.logger.debug(
                `Container ${id} state after stop attempt ${i + 1}: ${updatedContainer?.state}`
            );
            if (updatedContainer?.state === ContainerState.EXITED) {
                return updatedContainer;
            }
        }
        if (!updatedContainer) {
            throw new Error(`Container ${id} not found after stopping`);
        }
        return updatedContainer;
    }
}
