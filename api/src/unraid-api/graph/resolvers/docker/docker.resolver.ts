import { Query, ResolveField, Resolver } from '@nestjs/graphql';

import { AuthActionVerb, AuthPossession, UsePermissions } from 'nest-authz';

import { getDockerContainers } from '@app/core/modules/index';
import { Resource } from '@app/graphql/generated/api/types';

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
        resource: 'docker/container',
        possession: AuthPossession.ANY,
    })
    @ResolveField()
    public async containers() {
        return getDockerContainers({ useCache: false });
    }
}
