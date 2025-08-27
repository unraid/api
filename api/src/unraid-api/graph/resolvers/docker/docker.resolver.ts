import { Args, Mutation, Query, ResolveField, Resolver } from '@nestjs/graphql';

import { AuthAction, Resource } from '@unraid/shared/graphql.model.js';
import { UsePermissions } from '@unraid/shared/use-permissions.directive.js';

import { DockerOrganizerService } from '@app/unraid-api/graph/resolvers/docker/docker-organizer.service.js';
import {
    Docker,
    DockerContainer,
    DockerNetwork,
} from '@app/unraid-api/graph/resolvers/docker/docker.model.js';
import { DockerService } from '@app/unraid-api/graph/resolvers/docker/docker.service.js';
import { DEFAULT_ORGANIZER_ROOT_ID } from '@app/unraid-api/organizer/organizer.js';
import { OrganizerV1, ResolvedOrganizerV1 } from '@app/unraid-api/organizer/organizer.model.js';

@Resolver(() => Docker)
export class DockerResolver {
    constructor(
        private readonly dockerService: DockerService,
        private readonly dockerOrganizerService: DockerOrganizerService
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
        @Args('skipCache', { defaultValue: false, type: () => Boolean }) skipCache: boolean
    ) {
        return this.dockerService.getContainers({ skipCache });
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
    @ResolveField(() => ResolvedOrganizerV1)
    public async organizer() {
        return this.dockerOrganizerService.resolveOrganizer();
    }

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
}
