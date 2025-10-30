import { Args, Info, Mutation, Query, ResolveField, Resolver } from '@nestjs/graphql';

import type { GraphQLResolveInfo } from 'graphql';
import { AuthAction, Resource } from '@unraid/shared/graphql.model.js';
import { UsePermissions } from '@unraid/shared/use-permissions.directive.js';
import { GraphQLJSON } from 'graphql-scalars';

import { UseFeatureFlag } from '@app/unraid-api/decorators/use-feature-flag.decorator.js';
import { DockerFormService } from '@app/unraid-api/graph/resolvers/docker/docker-form.service.js';
import { DockerPhpService } from '@app/unraid-api/graph/resolvers/docker/docker-php.service.js';
import { DockerTemplateSyncResult } from '@app/unraid-api/graph/resolvers/docker/docker-template-scanner.model.js';
import { DockerTemplateScannerService } from '@app/unraid-api/graph/resolvers/docker/docker-template-scanner.service.js';
import { ExplicitStatusItem } from '@app/unraid-api/graph/resolvers/docker/docker-update-status.model.js';
import {
    Docker,
    DockerContainer,
    DockerContainerOverviewForm,
    DockerNetwork,
} from '@app/unraid-api/graph/resolvers/docker/docker.model.js';
import { DockerService } from '@app/unraid-api/graph/resolvers/docker/docker.service.js';
import { DockerOrganizerService } from '@app/unraid-api/graph/resolvers/docker/organizer/docker-organizer.service.js';
import { DEFAULT_ORGANIZER_ROOT_ID } from '@app/unraid-api/organizer/organizer.js';
import { ResolvedOrganizerV1 } from '@app/unraid-api/organizer/organizer.model.js';
import { GraphQLFieldHelper } from '@app/unraid-api/utils/graphql-field-helper.js';

@Resolver(() => Docker)
export class DockerResolver {
    constructor(
        private readonly dockerService: DockerService,
        private readonly dockerFormService: DockerFormService,
        private readonly dockerOrganizerService: DockerOrganizerService,
        private readonly dockerPhpService: DockerPhpService,
        private readonly dockerTemplateScannerService: DockerTemplateScannerService
    ) {}

    @UsePermissions({
        action: AuthAction.READ_ANY,
        resource: Resource.DOCKER,
    })
    @Query(() => Docker)
    public docker() {
        return {
            id: 'docker',
        };
    }

    @UsePermissions({
        action: AuthAction.READ_ANY,
        resource: Resource.DOCKER,
    })
    @ResolveField(() => [DockerContainer])
    public async containers(
        @Args('skipCache', { defaultValue: false, type: () => Boolean }) skipCache: boolean,
        @Info() info: GraphQLResolveInfo
    ) {
        const requestsSize = GraphQLFieldHelper.isFieldRequested(info, 'sizeRootFs');
        const containers = await this.dockerService.getContainers({ skipCache, size: requestsSize });
        const wasSynced = await this.dockerTemplateScannerService.syncMissingContainers(containers);
        return wasSynced ? await this.dockerService.getContainers({ skipCache: true }) : containers;
    }

    @UsePermissions({
        action: AuthAction.READ_ANY,
        resource: Resource.DOCKER,
    })
    @ResolveField(() => [DockerNetwork])
    public async networks(
        @Args('skipCache', { defaultValue: false, type: () => Boolean }) skipCache: boolean
    ) {
        return this.dockerService.getNetworks({ skipCache });
    }

    @UsePermissions({
        action: AuthAction.READ_ANY,
        resource: Resource.DOCKER,
    })
    @Query(() => DockerContainerOverviewForm)
    public async dockerContainerOverviewForm(
        @Args('skipCache', { defaultValue: false, type: () => Boolean }) skipCache: boolean
    ) {
        return this.dockerFormService.getContainerOverviewForm(skipCache);
    }

    @UseFeatureFlag('ENABLE_NEXT_DOCKER_RELEASE')
    @UsePermissions({
        action: AuthAction.READ_ANY,
        resource: Resource.DOCKER,
    })
    @ResolveField(() => ResolvedOrganizerV1)
    public async organizer(
        @Args('skipCache', { defaultValue: false, type: () => Boolean }) skipCache: boolean
    ) {
        return this.dockerOrganizerService.resolveOrganizer(undefined, { skipCache });
    }

    @UseFeatureFlag('ENABLE_NEXT_DOCKER_RELEASE')
    @UsePermissions({
        action: AuthAction.UPDATE_ANY,
        resource: Resource.DOCKER,
    })
    @Mutation(() => ResolvedOrganizerV1)
    public async createDockerFolder(
        @Args('name') name: string,
        @Args('parentId', { nullable: true }) parentId?: string,
        @Args('childrenIds', { type: () => [String], nullable: true }) childrenIds?: string[]
    ) {
        const organizer = await this.dockerOrganizerService.createFolder({
            name,
            parentId: parentId ?? DEFAULT_ORGANIZER_ROOT_ID,
            childrenIds: childrenIds ?? [],
        });
        return this.dockerOrganizerService.resolveOrganizer(organizer);
    }

    @UseFeatureFlag('ENABLE_NEXT_DOCKER_RELEASE')
    @UsePermissions({
        action: AuthAction.UPDATE_ANY,
        resource: Resource.DOCKER,
    })
    @Mutation(() => ResolvedOrganizerV1)
    public async setDockerFolderChildren(
        @Args('folderId', { nullable: true, type: () => String }) folderId: string | undefined,
        @Args('childrenIds', { type: () => [String] }) childrenIds: string[]
    ) {
        const organizer = await this.dockerOrganizerService.setFolderChildren({
            folderId: folderId ?? DEFAULT_ORGANIZER_ROOT_ID,
            childrenIds,
        });
        return this.dockerOrganizerService.resolveOrganizer(organizer);
    }

    @UseFeatureFlag('ENABLE_NEXT_DOCKER_RELEASE')
    @UsePermissions({
        action: AuthAction.UPDATE_ANY,
        resource: Resource.DOCKER,
    })
    @Mutation(() => ResolvedOrganizerV1)
    public async deleteDockerEntries(@Args('entryIds', { type: () => [String] }) entryIds: string[]) {
        const organizer = await this.dockerOrganizerService.deleteEntries({
            entryIds: new Set(entryIds),
        });
        return this.dockerOrganizerService.resolveOrganizer(organizer);
    }

    @UseFeatureFlag('ENABLE_NEXT_DOCKER_RELEASE')
    @UsePermissions({
        action: AuthAction.UPDATE_ANY,
        resource: Resource.DOCKER,
    })
    @Mutation(() => ResolvedOrganizerV1)
    public async moveDockerEntriesToFolder(
        @Args('sourceEntryIds', { type: () => [String] }) sourceEntryIds: string[],
        @Args('destinationFolderId') destinationFolderId: string
    ) {
        const organizer = await this.dockerOrganizerService.moveEntriesToFolder({
            sourceEntryIds,
            destinationFolderId,
        });
        return this.dockerOrganizerService.resolveOrganizer(organizer);
    }

    @UseFeatureFlag('ENABLE_NEXT_DOCKER_RELEASE')
    @UsePermissions({
        action: AuthAction.UPDATE_ANY,
        resource: Resource.DOCKER,
    })
    @Mutation(() => ResolvedOrganizerV1)
    public async moveDockerItemsToPosition(
        @Args('sourceEntryIds', { type: () => [String] }) sourceEntryIds: string[],
        @Args('destinationFolderId') destinationFolderId: string,
        @Args('position', { type: () => Number }) position: number
    ) {
        const organizer = await this.dockerOrganizerService.moveItemsToPosition({
            sourceEntryIds,
            destinationFolderId,
            position,
        });
        return this.dockerOrganizerService.resolveOrganizer(organizer);
    }

    @UseFeatureFlag('ENABLE_NEXT_DOCKER_RELEASE')
    @UsePermissions({
        action: AuthAction.UPDATE_ANY,
        resource: Resource.DOCKER,
    })
    @Mutation(() => ResolvedOrganizerV1)
    public async renameDockerFolder(
        @Args('folderId') folderId: string,
        @Args('newName') newName: string
    ) {
        const organizer = await this.dockerOrganizerService.renameFolderById({
            folderId,
            newName,
        });
        return this.dockerOrganizerService.resolveOrganizer(organizer);
    }

    @UseFeatureFlag('ENABLE_NEXT_DOCKER_RELEASE')
    @UsePermissions({
        action: AuthAction.UPDATE_ANY,
        resource: Resource.DOCKER,
    })
    @Mutation(() => ResolvedOrganizerV1)
    public async createDockerFolderWithItems(
        @Args('name') name: string,
        @Args('parentId', { nullable: true }) parentId?: string,
        @Args('sourceEntryIds', { type: () => [String], nullable: true }) sourceEntryIds?: string[],
        @Args('position', { type: () => Number, nullable: true }) position?: number
    ) {
        const organizer = await this.dockerOrganizerService.createFolderWithItems({
            name,
            parentId: parentId ?? DEFAULT_ORGANIZER_ROOT_ID,
            sourceEntryIds: sourceEntryIds ?? [],
            position,
        });
        return this.dockerOrganizerService.resolveOrganizer(organizer);
    }

    @UseFeatureFlag('ENABLE_NEXT_DOCKER_RELEASE')
    @UsePermissions({
        action: AuthAction.UPDATE_ANY,
        resource: Resource.DOCKER,
    })
    @Mutation(() => ResolvedOrganizerV1)
    public async updateDockerViewPreferences(
        @Args('viewId', { nullable: true, defaultValue: 'default' }) viewId: string,
        @Args('prefs', { type: () => GraphQLJSON }) prefs: Record<string, unknown>
    ) {
        const organizer = await this.dockerOrganizerService.updateViewPreferences({
            viewId,
            prefs,
        });
        return this.dockerOrganizerService.resolveOrganizer(organizer);
    }

    @UseFeatureFlag('ENABLE_NEXT_DOCKER_RELEASE')
    @UsePermissions({
        action: AuthAction.READ_ANY,
        resource: Resource.DOCKER,
    })
    @ResolveField(() => [ExplicitStatusItem])
    public async containerUpdateStatuses() {
        return this.dockerPhpService.getContainerUpdateStatuses();
    }

    @UseFeatureFlag('ENABLE_NEXT_DOCKER_RELEASE')
    @UsePermissions({
        action: AuthAction.UPDATE_ANY,
        resource: Resource.DOCKER,
    })
    @Mutation(() => DockerTemplateSyncResult)
    public async syncDockerTemplatePaths() {
        return this.dockerTemplateScannerService.scanTemplates();
    }
}
