import { Args, ResolveField, Resolver } from '@nestjs/graphql';

import {
    AuthActionVerb,
    AuthPossession,
    UsePermissions,
} from '@app/unraid-api/graph/directives/use-permissions.directive.js';
import { Resource } from '@app/unraid-api/graph/resolvers/base.model.js';
import { DockerContainer } from '@app/unraid-api/graph/resolvers/docker/docker.model.js';
import { DockerService } from '@app/unraid-api/graph/resolvers/docker/docker.service.js';
import { DockerMutations } from '@app/unraid-api/graph/resolvers/mutation/mutation.model.js';
import { PrefixedID } from '@app/unraid-api/graph/scalars/graphql-type-prefixed-id.js';

/**
 * Nested Resolvers for Mutations MUST use @ResolveField() instead of @Mutation()
 */
@Resolver(() => DockerMutations)
export class DockerMutationsResolver {
    constructor(private readonly dockerService: DockerService) {}

    @ResolveField(() => DockerContainer, { description: 'Start a container' })
    @UsePermissions({
        action: AuthActionVerb.UPDATE,
        resource: Resource.DOCKER,
        possession: AuthPossession.ANY,
    })
    public async start(@Args('id', { type: () => PrefixedID }) id: string) {
        return this.dockerService.start(id);
    }

    @ResolveField(() => DockerContainer, { description: 'Stop a container' })
    @UsePermissions({
        action: AuthActionVerb.UPDATE,
        resource: Resource.DOCKER,
        possession: AuthPossession.ANY,
    })
    public async stop(@Args('id', { type: () => PrefixedID }) id: string) {
        return this.dockerService.stop(id);
    }
}
