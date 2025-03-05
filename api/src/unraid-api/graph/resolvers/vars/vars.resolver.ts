import { Query, Resolver } from '@nestjs/graphql';

import { AuthActionVerb, AuthPossession, UsePermissions } from 'nest-authz';

import { Resource } from '@app/unraid-api/plugins/connect/api/graphql/generated/api/types.js';
import { getters } from '@app/store/index.js';

@Resolver('Vars')
export class VarsResolver {
    @Query()
    @UsePermissions({
        action: AuthActionVerb.READ,
        resource: Resource.VARS,
        possession: AuthPossession.ANY,
    })
    public async vars() {
        return {
            id: 'vars',
            ...(getters.emhttp().var ?? {}),
        };
    }
}
