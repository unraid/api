import { Query, Resolver } from '@nestjs/graphql';

import { AuthActionVerb, AuthPossession, UsePermissions } from 'nest-authz';

import { Resource } from '@app/unraid-api/plugins/connect/api/graphql/generated/api/types.js';

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
