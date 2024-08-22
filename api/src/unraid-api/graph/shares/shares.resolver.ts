import { getShares } from '@app/core/utils/index';
import { Query, Resolver } from '@nestjs/graphql';
import { UseRoles } from 'nest-access-control';

@Resolver('Shares')
export class SharesResolver {
    constructor() {}

    @UseRoles({
        resource: 'shares',
        action: 'read',
        possession: 'any',
    })
    @Query('shares')
    public async shares() {
        const userShares = getShares('users');
        const diskShares = getShares('disks');

        const shares = [...userShares, ...diskShares];

        return shares;
    }
}
