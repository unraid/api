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
            id: 'vars',
            ...getters.emhttp().var ?? {},
        }
    }
}
