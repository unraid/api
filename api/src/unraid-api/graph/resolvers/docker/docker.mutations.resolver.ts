import { Args, ResolveField, Resolver } from '@nestjs/graphql';

import { AuthActionVerb, AuthPossession, UsePermissions } from 'nest-authz';

import { Resource } from '@app/graphql/generated/api/types.js';
import { DockerService } from '@app/unraid-api/graph/resolvers/docker/docker.service.js';

@Resolver('DockerMutations')
export class DockerMutationsResolver {
    constructor(private readonly dockerService: DockerService) {}

    @ResolveField('startContainer')
    @UsePermissions({
        action: AuthActionVerb.UPDATE,
        resource: Resource.DOCKER,
        possession: AuthPossession.ANY,
    })
    public async startContainer(@Args('id') id: string) {
        return this.dockerService.startContainer(id);
    }

    @ResolveField('stopContainer')
    @UsePermissions({
        action: AuthActionVerb.UPDATE,
        resource: Resource.DOCKER,
        possession: AuthPossession.ANY,
    })
    public async stopContainer(@Args('id') id: string) {
        return this.dockerService.stopContainer(id);
    }
}
