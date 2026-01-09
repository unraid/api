import {
    Args,
    GraphQLISODateTime,
    Info,
    Int,
    Mutation,
    Query,
    ResolveField,
    Resolver,
    Subscription,
} from '@nestjs/graphql';

import type { GraphQLResolveInfo } from 'graphql';
import { AuthAction, Resource } from '@unraid/shared/graphql.model.js';
import { PrefixedID } from '@unraid/shared/prefixed-id-scalar.js';
import { UsePermissions } from '@unraid/shared/use-permissions.directive.js';
import { GraphQLJSON } from 'graphql-scalars';

import { PUBSUB_CHANNEL } from '@app/core/pubsub.js';
import { UseFeatureFlag } from '@app/unraid-api/decorators/use-feature-flag.decorator.js';
import { DockerConfigService } from '@app/unraid-api/graph/resolvers/docker/docker-config.service.js';
import { DockerPhpService } from '@app/unraid-api/graph/resolvers/docker/docker-php.service.js';
import { DockerStatsService } from '@app/unraid-api/graph/resolvers/docker/docker-stats.service.js';
import { DockerTemplateSyncResult } from '@app/unraid-api/graph/resolvers/docker/docker-template-scanner.model.js';
import { DockerTemplateScannerService } from '@app/unraid-api/graph/resolvers/docker/docker-template-scanner.service.js';
import { ExplicitStatusItem } from '@app/unraid-api/graph/resolvers/docker/docker-update-status.model.js';
import {
    Docker,
    DockerContainer,
    DockerContainerLogs,
    DockerContainerStats,
    DockerNetwork,
    DockerPortConflicts,
} from '@app/unraid-api/graph/resolvers/docker/docker.model.js';
import { DockerService } from '@app/unraid-api/graph/resolvers/docker/docker.service.js';
import { DockerOrganizerService } from '@app/unraid-api/graph/resolvers/docker/organizer/docker-organizer.service.js';
import { SubscriptionHelperService } from '@app/unraid-api/graph/services/subscription-helper.service.js';
import { SubscriptionTrackerService } from '@app/unraid-api/graph/services/subscription-tracker.service.js';
import { DEFAULT_ORGANIZER_ROOT_ID } from '@app/unraid-api/organizer/organizer.js';
import { ResolvedOrganizerV1 } from '@app/unraid-api/organizer/organizer.model.js';
import { GraphQLFieldHelper } from '@app/unraid-api/utils/graphql-field-helper.js';

@Resolver(() => Docker)
export class DockerResolver {
    constructor(
        private readonly dockerService: DockerService,
        private readonly dockerConfigService: DockerConfigService,
        private readonly dockerOrganizerService: DockerOrganizerService,
        private readonly dockerPhpService: DockerPhpService,
        private readonly dockerTemplateScannerService: DockerTemplateScannerService,
        private readonly dockerStatsService: DockerStatsService,
        private readonly subscriptionTracker: SubscriptionTrackerService,
        private readonly subscriptionHelper: SubscriptionHelperService
    ) {
        this.subscriptionTracker.registerTopic(
            PUBSUB_CHANNEL.DOCKER_STATS,
            () => this.dockerStatsService.startStatsStream(),
            () => this.dockerStatsService.stopStatsStream()
        );
    }

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

    @UseFeatureFlag('ENABLE_NEXT_DOCKER_RELEASE')
    @UsePermissions({
        action: AuthAction.READ_ANY,
        resource: Resource.DOCKER,
    })
    @ResolveField(() => DockerContainer, { nullable: true })
    public async container(@Args('id', { type: () => PrefixedID }) id: string) {
        const containers = await this.dockerService.getContainers();
        return containers.find((c) => c.id === id) ?? null;
    }

    @UsePermissions({
        action: AuthAction.READ_ANY,
        resource: Resource.DOCKER,
    })
    @ResolveField(() => [DockerContainer])
    public async containers(
        @Args('skipCache', {
            defaultValue: false,
            type: () => Boolean,
            deprecationReason: 'Caching has been removed; this parameter is now ignored',
        })
        _skipCache: boolean,
        @Info() info: GraphQLResolveInfo
    ) {
        const requestsRootFsSize = GraphQLFieldHelper.isFieldRequested(info, 'sizeRootFs');
        const requestsRwSize = GraphQLFieldHelper.isFieldRequested(info, 'sizeRw');
        const requestsLogSize = GraphQLFieldHelper.isFieldRequested(info, 'sizeLog');
        const rawContainers = await this.dockerService.getRawContainers({
            size: requestsRootFsSize || requestsRwSize,
        });

        if (requestsLogSize) {
            const names = Array.from(
                new Set(
                    rawContainers
                        .map((container) => container.names?.[0]?.replace(/^\//, '') || null)
                        .filter((name): name is string => Boolean(name))
                )
            );
            const logSizes = await this.dockerService.getContainerLogSizes(names);
            rawContainers.forEach((container) => {
                const normalized = container.names?.[0]?.replace(/^\//, '') || '';
                (container as { sizeLog?: number }).sizeLog = normalized
                    ? (logSizes.get(normalized) ?? 0)
                    : 0;
            });
        }

        await this.dockerTemplateScannerService.syncMissingContainers(rawContainers);
        return this.dockerService.enrichWithOrphanStatus(rawContainers);
    }

    @UsePermissions({
        action: AuthAction.READ_ANY,
        resource: Resource.DOCKER,
    })
    @ResolveField(() => DockerContainerLogs)
    public async logs(
        @Args('id', { type: () => PrefixedID }) id: string,
        @Args('since', { type: () => GraphQLISODateTime, nullable: true }) since?: Date | null,
        @Args('tail', { type: () => Int, nullable: true }) tail?: number | null
    ) {
        return this.dockerService.getContainerLogs(id, {
            since: since ?? undefined,
            tail,
        });
    }

    @UsePermissions({
        action: AuthAction.READ_ANY,
        resource: Resource.DOCKER,
    })
    @ResolveField(() => [DockerNetwork])
    public async networks(
        @Args('skipCache', {
            defaultValue: false,
            type: () => Boolean,
            deprecationReason: 'Caching has been removed; this parameter is now ignored',
        })
        _skipCache: boolean
    ) {
        return this.dockerService.getNetworks();
    }

    @UsePermissions({
        action: AuthAction.READ_ANY,
        resource: Resource.DOCKER,
    })
    @ResolveField(() => DockerPortConflicts)
    public async portConflicts(
        @Args('skipCache', {
            defaultValue: false,
            type: () => Boolean,
            deprecationReason: 'Caching has been removed; this parameter is now ignored',
        })
        _skipCache: boolean
    ) {
        return this.dockerService.getPortConflicts();
    }

    @UseFeatureFlag('ENABLE_NEXT_DOCKER_RELEASE')
    @UsePermissions({
        action: AuthAction.READ_ANY,
        resource: Resource.DOCKER,
    })
    @ResolveField(() => ResolvedOrganizerV1)
    public async organizer(
        @Args('skipCache', {
            defaultValue: false,
            type: () => Boolean,
            deprecationReason: 'Caching has been removed; this parameter is now ignored',
        })
        _skipCache: boolean
    ) {
        return this.dockerOrganizerService.resolveOrganizer();
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

    /**
     * Deletes organizer entries (folders). When a folder is deleted, its container
     * children are automatically appended to the end of the root folder via
     * `addMissingResourcesToView`. Containers are never permanently deleted by this operation.
     */
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

    @UseFeatureFlag('ENABLE_NEXT_DOCKER_RELEASE')
    @UsePermissions({
        action: AuthAction.UPDATE_ANY,
        resource: Resource.DOCKER,
    })
    @Mutation(() => Boolean, {
        description:
            'Reset Docker template mappings to defaults. Use this to recover from corrupted state.',
    })
    public async resetDockerTemplateMappings(): Promise<boolean> {
        const defaultConfig = this.dockerConfigService.defaultConfig();
        const currentConfig = this.dockerConfigService.getConfig();
        const resetConfig = {
            ...currentConfig,
            templateMappings: defaultConfig.templateMappings,
            skipTemplatePaths: defaultConfig.skipTemplatePaths,
        };
        const validated = await this.dockerConfigService.validate(resetConfig);
        this.dockerConfigService.replaceConfig(validated);
        return true;
    }

    @UsePermissions({
        action: AuthAction.READ_ANY,
        resource: Resource.DOCKER,
    })
    @Subscription(() => DockerContainerStats, {
        resolve: (payload) => payload.dockerContainerStats,
    })
    public dockerContainerStats() {
        return this.subscriptionHelper.createTrackedSubscription(PUBSUB_CHANNEL.DOCKER_STATS);
    }
}
