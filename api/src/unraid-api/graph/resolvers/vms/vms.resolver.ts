import { getDomains } from '@app/core/modules/vms/get-domains';
import { Query, Resolver } from '@nestjs/graphql';
import { UseRoles } from 'nest-access-control';

@Resolver()
export class VmsResolver {
    @Query()
    @UseRoles({
        resource: 'vms',
        action: 'read',
        possession: 'any',
    })
    public async vms() {
        return {};
    }

    @Resolver('domain')
    @Query()
    @UseRoles({
        resource: 'vms/domain',
        action: 'read',
        possession: 'any',
    })
    public async domain() {
        return getDomains();
    }
}
