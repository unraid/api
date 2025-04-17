import { Query, Resolver } from '@nestjs/graphql';

import { getShares } from '@app/core/utils/shares/get-shares.js';
import {
    AuthActionVerb,
    AuthPossession,
    UsePermissions,
} from '@app/unraid-api/graph/directives/use-permissions.directive.js';
import { Share } from '@app/unraid-api/graph/resolvers/array/array.model.js';
import { Resource } from '@app/unraid-api/graph/resolvers/base.model.js';

@Resolver(() => Share)
export class SharesResolver {
    constructor() {}

    @Query(() => [Share])
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
