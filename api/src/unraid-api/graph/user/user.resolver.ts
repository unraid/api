import { Query, Resolver } from '@nestjs/graphql';

import { Resource } from '@unraid/shared/graphql.model.js';
import {
    AuthActionVerb,
    AuthPossession,
    UsePermissions,
} from '@unraid/shared/use-permissions.directive.js';

import { GraphqlUser } from '@app/unraid-api/auth/user.decorator.js';
import { UserAccount } from '@app/unraid-api/graph/user/user.model.js';

@Resolver(() => UserAccount)
export class MeResolver {
    constructor() {}

    @Query(() => UserAccount)
    @UsePermissions({
        action: AuthActionVerb.READ,
        resource: Resource.ME,
        possession: AuthPossession.ANY,
    })
    public async me(@GraphqlUser() user: UserAccount): Promise<UserAccount> {
        return user;
    }
}
