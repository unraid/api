import { Query, Resolver } from '@nestjs/graphql';

import { getters } from '@app/store/index.js';
import {
    AuthActionVerb,
    AuthPossession,
    UsePermissions,
} from '@app/unraid-api/graph/directives/use-permissions.directive.js';
import { Resource } from '@app/unraid-api/graph/resolvers/base.model.js';
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
