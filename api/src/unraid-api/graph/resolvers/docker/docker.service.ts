import { Injectable, OnModuleInit } from '@nestjs/common';

import camelCaseKeys from 'camelcase-keys';
import Docker from 'dockerode';

import type { DockerContainer, DockerNetwork } from '@app/graphql/generated/api/types.js';
import {
    ContainerListingOptions,
    getDockerContainers,
} from '@app/core/modules/docker/get-docker-containers.js';
import { catchHandlers } from '@app/core/utils/misc/catch-handlers.js';

@Injectable()
export class DockerService {
    private client: Docker;

    constructor() {
        this.client = new Docker({
            socketPath: '/var/run/docker.sock',
        });
    }

    public async getContainers({ useCache }: ContainerListingOptions): Promise<DockerContainer[]> {
        return getDockerContainers({ useCache, docker: this.client });
    }

    /**
     * Get all Docker networks
     * @todo filtering / cache / proper typing
     * @returns All the in/active Docker networks on the system.
     */
    public async getNetworks(): Promise<DockerNetwork[]> {
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

    public async startContainer(id: string): Promise<DockerContainer> {
        const container = this.client.getContainer(id);
        await container.start();
        const containers = await this.getContainers({ useCache: false, docker: this.client });
        const updatedContainer = containers.find((c) => c.id === id);
        if (!updatedContainer) {
            throw new Error(`Container ${id} not found after starting`);
        }
        return updatedContainer;
    }

    public async stopContainer(id: string): Promise<DockerContainer> {
        const container = this.client.getContainer(id);
        await container.stop();
        const containers = await this.getContainers({ useCache: false, docker: this.client });
        const updatedContainer = containers.find((c) => c.id === id);
        if (!updatedContainer) {
            throw new Error(`Container ${id} not found after stopping`);
        }
        return updatedContainer;
    }
}
