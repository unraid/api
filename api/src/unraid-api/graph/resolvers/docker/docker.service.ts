import { Injectable } from '@nestjs/common';

import type { DockerContainer } from '@app/graphql/generated/api/types.js';
import { getDockerContainers } from '@app/core/modules/docker/get-docker-containers.js';
import { docker } from '@app/core/utils/clients/docker.js';

@Injectable()
export class DockerService {
    public async getContainers(useCache = false): Promise<DockerContainer[]> {
        return getDockerContainers({ useCache });
    }

    public async startContainer(id: string): Promise<DockerContainer> {
        const container = docker.getContainer(id);
        await container.start();
        const containers = await this.getContainers(false);
        const updatedContainer = containers.find((c) => c.id === id);
        if (!updatedContainer) {
            throw new Error(`Container ${id} not found after starting`);
        }
        return updatedContainer;
    }

    public async stopContainer(id: string): Promise<DockerContainer> {
        const container = docker.getContainer(id);
        await container.stop();
        const containers = await this.getContainers(false);
        const updatedContainer = containers.find((c) => c.id === id);
        if (!updatedContainer) {
            throw new Error(`Container ${id} not found after stopping`);
        }
        return updatedContainer;
    }
}
