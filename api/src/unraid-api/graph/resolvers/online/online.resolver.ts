import { Query, Resolver } from '@nestjs/graphql';

import { UsePermissions, AuthPossession } from 'nest-authz';

import { AuthActionVerb, Resource } from '@app/graphql/generated/api/types.js';

@Resolver('Online')
export class OnlineResolver {
    @Query()
    @UsePermissions({
        action: AuthActionVerb.READ,
        resource: Resource.ONLINE,
        possession: AuthPossession.ANY,
    })
    public async online() {
        return true;
    }
}
