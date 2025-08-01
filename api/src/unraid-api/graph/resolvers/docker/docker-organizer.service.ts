import { Injectable, Logger } from '@nestjs/common';

import type { ContainerListOptions } from 'dockerode';

import { DockerConfigService } from '@app/unraid-api/graph/resolvers/docker/docker-config.service.js';
import { DockerContainer } from '@app/unraid-api/graph/resolvers/docker/docker.model.js';
import { DockerService } from '@app/unraid-api/graph/resolvers/docker/docker.service.js';
import {
    OrganizerContainerResource,
    OrganizerV1,
    ResolvedOrganizerV1,
} from '@app/unraid-api/organizer/organizer.dto.js';
import {
    addMissingResourcesToView,
    createFolderInView,
    CreateFolderInViewParams,
    resolveOrganizer,
    setFolderChildrenInView,
    SetFolderChildrenInViewParams,
} from '@app/unraid-api/organizer/organizer.js';

export function containerToResource(container: DockerContainer): OrganizerContainerResource {
    const stableRef = container.names[0] || container.image;
    return {
        id: stableRef,
        type: 'container',
        name: stableRef,
        meta: container,
    };
}

export function containerListToResourcesObject(containers: DockerContainer[]): OrganizerV1['resources'] {
    return containers.reduce(
        (acc, container) => {
            const resource = containerToResource(container);
            acc[resource.id] = resource;
            return acc;
        },
        {} as OrganizerV1['resources']
    );
}

@Injectable()
export class DockerOrganizerService {
    private readonly logger = new Logger(DockerOrganizerService.name);
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
    ): Promise<OrganizerV1> {
        const newOrganizer = structuredClone(organizer);
        const view = newOrganizer.views.default ?? {
            id: 'default',
            name: 'Default',
            root: 'root',
            entries: {},
        };
        resources ??= await this.getResources();

        const updatedView = addMissingResourcesToView(resources, view);
        newOrganizer.views.default = updatedView;
        return newOrganizer;
    }

    async syncAndGetOrganizer(): Promise<OrganizerV1> {
        let organizer = this.dockerConfigService.getConfig();
        organizer.resources = await this.getResources();
        organizer = await this.syncDefaultView(organizer, organizer.resources);
        organizer = await this.dockerConfigService.validate(organizer);
        this.dockerConfigService.replaceConfig(organizer);
        return organizer;
    }

    async resolveOrganizer(organizer?: OrganizerV1): Promise<ResolvedOrganizerV1> {
        organizer ??= await this.syncAndGetOrganizer();
        return resolveOrganizer(organizer);
    }

    async createFolder(params: {
        name: string;
        parentId?: string;
        childrenIds?: string[];
    }): Promise<OrganizerV1> {
        const { name, parentId = 'root', childrenIds = [] } = params;
        const organizer = await this.syncAndGetOrganizer();

        // Validate parent exists and is a folder
        const defaultView = organizer.views.default;
        if (!defaultView) {
            throw new Error('Default view not found');
        }

        const parentEntry = defaultView.entries[parentId];
        if (!parentEntry || parentEntry.type !== 'folder') {
            throw new Error(`Parent ${parentId} not found or is not a folder`);
        }

        // Generate unique folder ID
        // const folderId = `folder-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

        // Use pure function to create folder
        const updatedView = createFolderInView({
            view: defaultView,
            folderId: name,
            folderName: name,
            parentId,
            childrenIds,
        });

        // Update organizer with new view
        const newOrganizer = structuredClone(organizer);
        newOrganizer.views.default = updatedView;

        // Save and return updated organizer
        const validated = await this.dockerConfigService.validate(newOrganizer);
        this.dockerConfigService.replaceConfig(validated);
        return validated;
    }

    async setFolderChildren(params: { folderId?: string; childrenIds: string[] }): Promise<OrganizerV1> {
        const { folderId = 'root', childrenIds } = params;
        const organizer = await this.syncAndGetOrganizer();

        // Validate view exists
        const defaultView = organizer.views.default;
        if (!defaultView) {
            throw new Error('Default view not found');
        }

        // Validate folder exists and is a folder
        const targetFolder = defaultView.entries[folderId];
        if (!targetFolder || targetFolder.type !== 'folder') {
            throw new Error(`Folder ${folderId} not found or is not a folder`);
        }

        // Validate all children exist
        for (const childId of childrenIds) {
            const childEntry = defaultView.entries[childId];
            const childResource = organizer.resources[childId];

            if (!childEntry && !childResource) {
                throw new Error(`Child ${childId} not found in entries or resources`);
            }
        }

        // Use pure function to update folder children
        const updatedView = setFolderChildrenInView({
            view: defaultView,
            folderId,
            childrenIds,
            resources: organizer.resources,
        });

        // Update organizer with new view
        const newOrganizer = structuredClone(organizer);
        newOrganizer.views.default = updatedView;

        // Save and return updated organizer
        const validated = await this.dockerConfigService.validate(newOrganizer);
        this.dockerConfigService.replaceConfig(validated);
        return validated;
    }
}
