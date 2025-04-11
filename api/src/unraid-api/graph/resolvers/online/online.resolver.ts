import { Query, Resolver } from '@nestjs/graphql';

import {
    AuthActionVerb,
    AuthPossession,
    UsePermissions,
} from '@app/unraid-api/graph/directives/use-permissions.directive.js';
import { Resource } from '@app/unraid-api/graph/resolvers/base.model.js';
import { Online } from '@app/unraid-api/graph/resolvers/online/online.model.js';

@Resolver(() => Online)
export class OnlineResolver {
    @Query(() => Boolean)
    @UsePermissions({
        action: AuthActionVerb.READ,
        resource: Resource.ONLINE,
        possession: AuthPossession.ANY,
    })
    public async online() {
        return true;
    }
}
