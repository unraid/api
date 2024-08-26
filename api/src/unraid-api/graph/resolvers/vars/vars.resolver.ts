import { getServerIdentifier } from '@app/core/utils/server-identifier';
import { getters } from '@app/store/index';
import { Query, Resolver } from '@nestjs/graphql';
import { UseRoles } from 'nest-access-control';

@Resolver()
export class VarsResolver {
    @Query()
    @UseRoles({
        resource: 'vars',
        action: 'read',
        possession: 'any',
    })
    public async vars() {
        return {
            id: getServerIdentifier('vars'),
            ...getters.emhttp().var ?? {},
        }
    }
}
