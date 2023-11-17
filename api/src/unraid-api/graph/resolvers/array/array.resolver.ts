import { getArrayData } from '@app/core/modules/array/get-array-data';
import { store } from '@app/store/index';
import { Resolver, Query } from '@nestjs/graphql';
import { UseRoles } from 'nest-access-control';

@Resolver('Array')
export class ArrayResolver {
    @Query()
    @UseRoles({
        resource: 'array',
        action: 'read',
        possession: 'own'
    })
    public async array() {
        return getArrayData(store.getState);
    }
}
