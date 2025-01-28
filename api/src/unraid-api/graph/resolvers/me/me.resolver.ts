import { Query, Resolver } from '@nestjs/graphql';

import { AuthActionVerb, AuthPossession, UsePermissions } from 'nest-authz';

import type { UserAccount } from '@app/graphql/generated/api/types';
import { Me, Resource } from '@app/graphql/generated/api/types';
import { GraphqlUser } from '@app/unraid-api/auth/user.decorator';

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
