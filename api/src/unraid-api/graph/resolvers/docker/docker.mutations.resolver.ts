import { Args, ResolveField, Resolver } from '@nestjs/graphql';

import { AuthAction, Resource } from '@unraid/shared/graphql.model.js';
import { PrefixedID } from '@unraid/shared/prefixed-id-scalar.js';
import { UsePermissions } from '@unraid/shared/use-permissions.directive.js';

import { DockerContainer } from '@app/unraid-api/graph/resolvers/docker/docker.model.js';
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
}
