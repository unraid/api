import { Query, Resolver } from '@nestjs/graphql';

import { AuthActionVerb, AuthPossession, UsePermissions } from 'nest-authz';

import type { UserAccount } from '@app/unraid-api/plugins/connect/api/graphql/generated/api/types.js';
import { Me, Resource } from '@app/unraid-api/plugins/connect/api/graphql/generated/api/types.js';
import { GraphqlUser } from '@app/unraid-api/auth/user.decorator.js';

@Resolver('Me')
export class MeResolver {
    constructor() {}

    @Query()
    @UsePermissions({
        action: AuthActionVerb.READ,
        resource: Resource.ME,
        possession: AuthPossession.ANY,
    })
    public async me(@GraphqlUser() user: UserAccount): Promise<Me> {
        return user;
    }
}
