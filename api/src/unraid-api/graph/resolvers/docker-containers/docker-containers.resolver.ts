import { getDockerContainers } from '@app/core/modules/index';
import { Query, Resolver } from '@nestjs/graphql';
import { UseRoles } from 'nest-access-control';

@Resolver('DockerContainers')
export class DockerContainersResolver {
    @Query()
    @UseRoles({
        resource: 'docker/container',
        action: 'read',
        possession: 'any',
    })
    public async dockerContainers() {
        return getDockerContainers();
    }
}
