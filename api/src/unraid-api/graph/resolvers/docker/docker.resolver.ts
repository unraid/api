import { Query, ResolveField, Resolver } from '@nestjs/graphql';

import { AuthActionVerb, AuthPossession, UsePermissions } from 'nest-authz';

import { Resource } from '@app/unraid-api/plugins/connect/api/graphql/generated/api/types.js';

@Resolver('Docker')
export class DockerResolver {
    @UsePermissions({
        action: AuthActionVerb.READ,
        resource: Resource.DOCKER,
        possession: AuthPossession.ANY,
    })
    @Query()
    public docker() {
        return {
            id: 'docker',
        };
    }

    @UsePermissions({
        action: AuthActionVerb.READ,
        resource: Resource.DOCKER,
        possession: AuthPossession.ANY,
    })
    @ResolveField()
    public async containers() {
        const { getDockerContainers } = await import(
            '@app/core/modules/docker/get-docker-containers.js'
        );

        return getDockerContainers({ useCache: false });
    }
}
