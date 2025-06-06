import { Query, Resolver } from '@nestjs/graphql';

import { Resource } from '@unraid/shared/graphql.model.js';
import {
    AuthActionVerb,
    AuthPossession,
    UsePermissions,
} from '@unraid/shared/use-permissions.directive.js';

import { getters } from '@app/store/index.js';
import { Vars } from '@app/unraid-api/graph/resolvers/vars/vars.model.js';

@Resolver(() => Vars)
export class VarsResolver {
    @Query(() => Vars)
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
