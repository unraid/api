import { Injectable } from '@nestjs/common';

import type { ContainerListOptions } from 'dockerode';

import { DockerConfigService } from '@app/unraid-api/graph/resolvers/docker/docker-config.service.js';
import { DockerContainer } from '@app/unraid-api/graph/resolvers/docker/docker.model.js';
import { DockerService } from '@app/unraid-api/graph/resolvers/docker/docker.service.js';
import {
    OrganizerContainerResource,
    OrganizerFolder,
    OrganizerResource,
    OrganizerResourceRef,
    OrganizerV1,
    OrganizerView,
    ResolvedOrganizerV1,
} from '@app/unraid-api/organizer/organizer.dto.js';
import {
    addMissingResourcesToView,
    resolveOrganizer,
    resourceToResourceRef,
} from '@app/unraid-api/organizer/organizer.js';

export function containerToResource(container: DockerContainer): OrganizerContainerResource {
    const stableRef = container.names[0] || container.image;
    return {
        id: container.id,
        type: 'container',
        name: stableRef,
        meta: container,
    };
}

export function containerListToResourcesObject(containers: DockerContainer[]): OrganizerV1['resources'] {
    return containers.reduce(
        (acc, container) => {
            acc[container.id] = containerToResource(container);
            return acc;
        },
        {} as OrganizerV1['resources']
    );
}

@Injectable()
export class DockerOrganizerService {
    constructor(
        private readonly dockerConfigService: DockerConfigService,
        private readonly dockerService: DockerService
    ) {}

    async getResources(opts?: ContainerListOptions): Promise<OrganizerV1['resources']> {
        const containers = await this.dockerService.getContainers(opts);
        return containerListToResourcesObject(containers);
    }

    async syncDefaultView(
        organizer: OrganizerV1,
        resources?: OrganizerV1['resources']
    ): Promise<OrganizerView> {
        const view = organizer.views.default ?? {
            id: 'default',
            name: 'Default',
            root: 'root',
            entries: {},
        };
        resources ??= await this.getResources();

        const updatedView = addMissingResourcesToView(resources, view);
        organizer.views.default = updatedView;
        return updatedView;
    }

    async getOrganizer(): Promise<OrganizerV1> {
        const organizer = this.dockerConfigService.getConfig();
        organizer.resources = await this.getResources();
        this.syncDefaultView(organizer, organizer.resources);
        return organizer;
    }

    async getResolvedOrganizer(): Promise<ResolvedOrganizerV1> {
        const organizer = await this.getOrganizer();
        return resolveOrganizer(organizer);
    }
}
