import { Query, Resolver } from '@nestjs/graphql';

import { AuthAction, Resource } from '@unraid/shared/graphql.model.js';
import { UsePermissions } from '@unraid/shared/use-permissions.directive.js';

import { Online } from '@app/unraid-api/graph/resolvers/online/online.model.js';

@Resolver(() => Online)
export class OnlineResolver {
    @Query(() => Boolean)
    @UsePermissions({
        action: AuthAction.READ_ANY,
        resource: Resource.ONLINE,
    })
    public async online() {
        return true;
    }
}
