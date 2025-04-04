import { Args, ResolveField, Resolver } from '@nestjs/graphql';

import { AuthActionVerb, AuthPossession, UsePermissions } from 'nest-authz';

import { Resource } from '@app/graphql/generated/api/types.js';
import { DockerService } from '@app/unraid-api/graph/resolvers/docker/docker.service.js';

@Resolver('DockerMutations')
export class DockerMutationsResolver {
    constructor(private readonly dockerService: DockerService) {}

    @ResolveField('start')
    @UsePermissions({
        action: AuthActionVerb.UPDATE,
        resource: Resource.DOCKER,
        possession: AuthPossession.ANY,
    })
    public async start(@Args('id') id: string) {
        return this.dockerService.start(id);
    }

    @ResolveField('stop')
    @UsePermissions({
        action: AuthActionVerb.UPDATE,
        resource: Resource.DOCKER,
        possession: AuthPossession.ANY,
    })
    public async stop(@Args('id') id: string) {
        return this.dockerService.stop(id);
    }
}
