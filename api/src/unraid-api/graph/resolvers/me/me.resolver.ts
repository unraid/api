import { Query, Resolver } from '@nestjs/graphql';

import { GraphQLError } from 'graphql';
import { AuthActionVerb, AuthPossession, UsePermissions } from 'nest-authz';

import type { User } from '@app/graphql/generated/api/types';
import { Me, Resource } from '@app/graphql/generated/api/types';
import { GraphqlUser } from '@app/unraid-api/auth/user.decorator';

@Resolver()
export class MeResolver {
    constructor() {}

    @Query()
    @UsePermissions({
        action: AuthActionVerb.READ,
        resource: Resource.ME,
        possession: AuthPossession.ANY,
    })
    public async me(@GraphqlUser() user: User): Promise<Me> {
        const { description, permissions, id, name, roles } = user;

        if (!id || !name) {
            throw new GraphQLError('Invalid user data');
        }

        return {
            description,
            permissions: permissions || [],
            id,
            name,
            roles: roles || [],
        };
    }
}
