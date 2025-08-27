import { Query, Resolver } from '@nestjs/graphql';

import { AuthAction, Resource } from '@unraid/shared/graphql.model.js';
import { UsePermissions } from '@unraid/shared/use-permissions.directive.js';

import { GraphqlUser } from '@app/unraid-api/auth/user.decorator.js';
import { UserAccount } from '@app/unraid-api/graph/user/user.model.js';

@Resolver(() => UserAccount)
export class MeResolver {
    constructor() {}

    @Query(() => UserAccount)
    @UsePermissions({
        action: AuthAction.READ_ANY,
        resource: Resource.ME,
    })
    public async me(@GraphqlUser() user: UserAccount): Promise<UserAccount> {
        return user;
    }
}
