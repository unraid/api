import { Args, ResolveField, Resolver } from '@nestjs/graphql';

import { AuthAction, Resource } from '@unraid/shared/graphql.model.js';
import { PrefixedID } from '@unraid/shared/prefixed-id-scalar.js';
import { UsePermissions } from '@unraid/shared/use-permissions.directive.js';

import { UseFeatureFlag } from '@app/unraid-api/decorators/use-feature-flag.decorator.js';
import {
    DockerAutostartEntryInput,
    DockerContainer,
} from '@app/unraid-api/graph/resolvers/docker/docker.model.js';
import { DockerService } from '@app/unraid-api/graph/resolvers/docker/docker.service.js';
import { DockerMutations } from '@app/unraid-api/graph/resolvers/mutation/mutation.model.js';

/**
 * Nested Resolvers for Mutations MUST use @ResolveField() instead of @Mutation()
 */
@Resolver(() => DockerMutations)
export class DockerMutationsResolver {
    constructor(private readonly dockerService: DockerService) {}

    @ResolveField(() => DockerContainer, { description: 'Start a container' })
    @UsePermissions({
        action: AuthAction.UPDATE_ANY,
        resource: Resource.DOCKER,
    })
    public async start(@Args('id', { type: () => PrefixedID }) id: string) {
        return this.dockerService.start(id);
    }

    @ResolveField(() => DockerContainer, { description: 'Stop a container' })
    @UsePermissions({
        action: AuthAction.UPDATE_ANY,
        resource: Resource.DOCKER,
    })
    public async stop(@Args('id', { type: () => PrefixedID }) id: string) {
        return this.dockerService.stop(id);
    }
    @ResolveField(() => DockerContainer, { description: 'Pause (Suspend) a container' })
    @UsePermissions({
        action: AuthAction.UPDATE_ANY,
        resource: Resource.DOCKER,
    })
    public async pause(@Args('id', { type: () => PrefixedID }) id: string) {
        return this.dockerService.pause(id);
    }
    @ResolveField(() => DockerContainer, { description: 'Unpause (Resume) a container' })
    @UsePermissions({
        action: AuthAction.UPDATE_ANY,
        resource: Resource.DOCKER,
    })
    public async unpause(@Args('id', { type: () => PrefixedID }) id: string) {
        return this.dockerService.unpause(id);
    }

    @ResolveField(() => Boolean, {
        description: 'Update auto-start configuration for Docker containers',
    })
    @UseFeatureFlag('ENABLE_NEXT_DOCKER_RELEASE')
    @UsePermissions({
        action: AuthAction.UPDATE_ANY,
        resource: Resource.DOCKER,
    })
    public async updateAutostartConfiguration(
        @Args('entries', { type: () => [DockerAutostartEntryInput] })
        entries: DockerAutostartEntryInput[],
        @Args('persistUserPreferences', { type: () => Boolean, nullable: true })
        persistUserPreferences?: boolean
    ) {
        await this.dockerService.updateAutostartConfiguration(entries, {
            persistUserPreferences,
        });
        return true;
    }

    @ResolveField(() => DockerContainer, { description: 'Update a container to the latest image' })
    @UsePermissions({
        action: AuthAction.UPDATE_ANY,
        resource: Resource.DOCKER,
    })
    public async updateContainer(@Args('id', { type: () => PrefixedID }) id: string) {
        return this.dockerService.updateContainer(id);
    }

    @ResolveField(() => [DockerContainer], {
        description: 'Update multiple containers to the latest images',
    })
    @UsePermissions({
        action: AuthAction.UPDATE_ANY,
        resource: Resource.DOCKER,
    })
    public async updateContainers(
        @Args('ids', { type: () => [PrefixedID] })
        ids: string[]
    ) {
        return this.dockerService.updateContainers(ids);
    }
}
