import { getDockerContainers } from '@app/core/modules/index';
import { getServerIdentifier } from '@app/core/utils/server-identifier';
import { Query, ResolveField, Resolver } from '@nestjs/graphql';
import { UseRoles } from 'nest-access-control';

@Resolver('Docker')
export class DockerResolver {
    @UseRoles({
        resource: 'docker',
        action: 'read',
        possession: 'any',
    })
    @Query()
    public docker() {
        return {
            id: getServerIdentifier('docker'),
        };
    }

    @UseRoles({
        resource: 'docker/container',
        action: 'read',
        possession: 'any',
    })
    @ResolveField()
    public async containers() {
        return getDockerContainers({ useCache: false });
    }
}
