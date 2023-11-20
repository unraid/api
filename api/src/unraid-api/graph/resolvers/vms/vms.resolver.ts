import { getDomains } from '@app/core/modules/vms/get-domains';
import { Query, Resolver } from '@nestjs/graphql';
import { UseRoles } from 'nest-access-control';

@Resolver()
export class VmsResolver {
    @Query()
    public async vms() {
        /**
         * @todo Method implemntation
         */
        return {};
    }

    @Resolver('domain')
    @Query()
    @UseRoles({
        resource: 'domain',
        action: 'read',
        possession: 'any',
    })
    public async domain() {
        return getDomains();
    }
}
