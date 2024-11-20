import { Query, Resolver } from '@nestjs/graphql';

import { AuthActionVerb, AuthPossession, UsePermissions } from 'nest-authz';

import { getShares } from '@app/core/utils/index';
import { Resource } from '@app/graphql/generated/api/types';

@Resolver('Shares')
export class SharesResolver {
    constructor() {}

    @Query('shares')
    @UsePermissions({
        action: AuthActionVerb.READ,
        resource: Resource.SHARE,
        possession: AuthPossession.ANY,
    })
    public async shares() {
        const userShares = getShares('users');
        const diskShares = getShares('disks');

        const shares = [...userShares, ...diskShares];

        return shares;
    }
}
