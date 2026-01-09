import { Injectable, Logger } from '@nestjs/common';

import type { ContainerListOptions } from 'dockerode';

import { AppError } from '@app/core/errors/app-error.js';
import { DockerTemplateScannerService } from '@app/unraid-api/graph/resolvers/docker/docker-template-scanner.service.js';
import { DockerContainer } from '@app/unraid-api/graph/resolvers/docker/docker.model.js';
import { DockerService } from '@app/unraid-api/graph/resolvers/docker/docker.service.js';
import { DockerOrganizerConfigService } from '@app/unraid-api/graph/resolvers/docker/organizer/docker-organizer-config.service.js';
import {
    addMissingResourcesToView,
    createFolderInView,
    createFolderWithItems,
    DEFAULT_ORGANIZER_ROOT_ID,
    DEFAULT_ORGANIZER_VIEW_ID,
    deleteOrganizerEntries,
    moveEntriesToFolder,
    moveItemsToPosition,
    renameFolder,
    resolveOrganizer,
    setFolderChildrenInView,
} from '@app/unraid-api/organizer/organizer.js';
import {
    OrganizerContainerResource,
    OrganizerV1,
    ResolvedOrganizerV1,
} from '@app/unraid-api/organizer/organizer.model.js';

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
        private readonly dockerConfigService: DockerOrganizerConfigService,
        private readonly dockerService: DockerService,
        private readonly dockerTemplateScannerService: DockerTemplateScannerService
    ) {}

    async getResources(opts?: Partial<ContainerListOptions>): Promise<OrganizerV1['resources']> {
        const rawContainers = await this.dockerService.getRawContainers(opts);
        await this.dockerTemplateScannerService.syncMissingContainers(rawContainers);
        const containers = this.dockerService.enrichWithOrphanStatus(rawContainers);
        return containerListToResourcesObject(containers);
    }

    async syncDefaultView(
        organizer: OrganizerV1,
        resources?: OrganizerV1['resources']
    ): Promise<OrganizerV1> {
        const newOrganizer = structuredClone(organizer);
        const view = newOrganizer.views.default ?? {
            id: DEFAULT_ORGANIZER_VIEW_ID,
            name: 'Default',
            root: DEFAULT_ORGANIZER_ROOT_ID,
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
        const { name, parentId = DEFAULT_ORGANIZER_ROOT_ID, childrenIds = [] } = params;

        if (name === DEFAULT_ORGANIZER_ROOT_ID) {
            throw new AppError(`Folder name '${name}' is reserved`);
        } else if (name === parentId) {
            throw new AppError(`Folder ID '${name}' cannot be the same as the parent ID`);
        } else if (!name) {
            throw new AppError(`Folder name cannot be empty`);
        }

        const organizer = await this.syncAndGetOrganizer();
        // Validate parent exists and is a folder
        const defaultView = organizer.views.default;
        if (!defaultView) {
            throw new AppError('Default view not found');
        }

        const parentEntry = defaultView.entries[parentId];
        if (!parentEntry || parentEntry.type !== 'folder') {
            throw new AppError(`Parent '${parentId}' not found or is not a folder`);
        }

        // If folder already exists, we don't need to create it
        if (parentEntry.children.includes(name)) {
            return organizer;
        }

        // Use pure function to create folder
        const updatedView = createFolderInView({
            view: defaultView,
            parentId,
            folderId: name,
            folderName: name,
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
        const { folderId = DEFAULT_ORGANIZER_ROOT_ID, childrenIds } = params;
        const organizer = await this.syncAndGetOrganizer();

        // Validate view exists
        const defaultView = organizer.views.default;
        if (!defaultView) {
            throw new AppError('Default view not found');
        }

        // Validate folder exists and is a folder
        const targetFolder = defaultView.entries[folderId];
        if (!targetFolder) {
            throw new AppError(`Folder '${folderId}' not found`);
        }
        if (targetFolder.type !== 'folder') {
            throw new AppError(`Entry '${folderId}' is not a folder`);
        }

        // Validate all children exist
        for (const childId of childrenIds) {
            const childEntry = defaultView.entries[childId];
            const childResource = organizer.resources[childId];

            if (!childEntry && !childResource) {
                throw new AppError(`Child '${childId}' not found in entries or resources`);
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

    async deleteEntries(params: { entryIds: Set<string> }): Promise<OrganizerV1> {
        const { entryIds } = params;
        const organizer = await this.syncAndGetOrganizer();
        const newOrganizer = structuredClone(organizer);

        deleteOrganizerEntries(newOrganizer.views.default, entryIds, { mutate: true });
        newOrganizer.views.default = addMissingResourcesToView(
            newOrganizer.resources,
            newOrganizer.views.default
        );

        const validated = await this.dockerConfigService.validate(newOrganizer);
        this.dockerConfigService.replaceConfig(validated);
        return validated;
    }

    async moveEntriesToFolder(params: {
        sourceEntryIds: string[];
        destinationFolderId: string;
    }): Promise<OrganizerV1> {
        const { sourceEntryIds, destinationFolderId } = params;
        const organizer = await this.syncAndGetOrganizer();
        const newOrganizer = structuredClone(organizer);

        const defaultView = newOrganizer.views.default;
        if (!defaultView) {
            throw new AppError('Default view not found');
        }

        newOrganizer.views.default = moveEntriesToFolder({
            view: defaultView,
            sourceEntryIds: new Set(sourceEntryIds),
            destinationFolderId,
        });

        const validated = await this.dockerConfigService.validate(newOrganizer);
        this.dockerConfigService.replaceConfig(validated);
        return validated;
    }

    async moveItemsToPosition(params: {
        sourceEntryIds: string[];
        destinationFolderId: string;
        position: number;
    }): Promise<OrganizerV1> {
        const { sourceEntryIds, destinationFolderId, position } = params;
        const organizer = await this.syncAndGetOrganizer();
        const newOrganizer = structuredClone(organizer);

        const defaultView = newOrganizer.views.default;
        if (!defaultView) {
            throw new AppError('Default view not found');
        }

        newOrganizer.views.default = moveItemsToPosition({
            view: defaultView,
            sourceEntryIds: new Set(sourceEntryIds),
            destinationFolderId,
            position,
            resources: newOrganizer.resources,
        });

        const validated = await this.dockerConfigService.validate(newOrganizer);
        this.dockerConfigService.replaceConfig(validated);
        return validated;
    }

    async renameFolderById(params: { folderId: string; newName: string }): Promise<OrganizerV1> {
        const { folderId, newName } = params;
        const organizer = await this.syncAndGetOrganizer();
        const newOrganizer = structuredClone(organizer);

        const defaultView = newOrganizer.views.default;
        if (!defaultView) {
            throw new AppError('Default view not found');
        }

        newOrganizer.views.default = renameFolder({
            view: defaultView,
            folderId,
            newName,
        });

        const validated = await this.dockerConfigService.validate(newOrganizer);
        this.dockerConfigService.replaceConfig(validated);
        return validated;
    }

    async createFolderWithItems(params: {
        name: string;
        parentId?: string;
        sourceEntryIds?: string[];
        position?: number;
    }): Promise<OrganizerV1> {
        const { name, parentId = DEFAULT_ORGANIZER_ROOT_ID, sourceEntryIds = [], position } = params;

        if (name === DEFAULT_ORGANIZER_ROOT_ID) {
            throw new AppError(`Folder name '${name}' is reserved`);
        } else if (name === parentId) {
            throw new AppError(`Folder ID '${name}' cannot be the same as the parent ID`);
        } else if (!name) {
            throw new AppError(`Folder name cannot be empty`);
        }

        const organizer = await this.syncAndGetOrganizer();
        const defaultView = organizer.views.default;
        if (!defaultView) {
            throw new AppError('Default view not found');
        }

        const parentEntry = defaultView.entries[parentId];
        if (!parentEntry || parentEntry.type !== 'folder') {
            throw new AppError(`Parent '${parentId}' not found or is not a folder`);
        }

        if (parentEntry.children.includes(name)) {
            return organizer;
        }

        const newOrganizer = structuredClone(organizer);
        newOrganizer.views.default = createFolderWithItems({
            view: defaultView,
            folderId: name,
            folderName: name,
            parentId,
            sourceEntryIds,
            position,
            resources: newOrganizer.resources,
        });

        const validated = await this.dockerConfigService.validate(newOrganizer);
        this.dockerConfigService.replaceConfig(validated);
        return validated;
    }

    async updateViewPreferences(params: {
        viewId?: string;
        prefs: Record<string, unknown>;
    }): Promise<OrganizerV1> {
        const { viewId = DEFAULT_ORGANIZER_VIEW_ID, prefs } = params;
        const organizer = await this.syncAndGetOrganizer();
        const newOrganizer = structuredClone(organizer);

        const view = newOrganizer.views[viewId];
        if (!view) {
            throw new AppError(`View '${viewId}' not found`);
        }

        view.prefs = prefs;

        const validated = await this.dockerConfigService.validate(newOrganizer);
        this.dockerConfigService.replaceConfig(validated);
        return validated;
    }
}
