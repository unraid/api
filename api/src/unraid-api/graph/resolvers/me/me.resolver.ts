import { Query, Resolver } from '@nestjs/graphql';

import { AuthActionVerb, AuthPossession, AuthZService, UsePermissions } from 'nest-authz';

import { Me, Resource, User } from '@app/graphql/generated/api/types';
import { GraphqlUser } from '@app/unraid-api/auth/user.decorator';

@Resolver()
export class MeResolver {
    constructor(private readonly authzSrv: AuthZService) {}

    @Query()
    @UsePermissions({
        action: AuthActionVerb.READ,
        resource: Resource.ME,
        possession: AuthPossession.ANY,
    })
    public async me(@GraphqlUser() user: User): Promise<Me> {
        return {
            description: user.description,
            permissions: user.permissions,
            id: user.id,
            name: user.name,
            roles: user.roles,
        };
    }
}
