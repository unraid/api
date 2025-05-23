import { Args, Query, Resolver } from '@nestjs/graphql';

import { ApiKeyService } from '@app/unraid-api/auth/api-key.service.js';
import { AuthService } from '@app/unraid-api/auth/auth.service.js';
import {
    AuthActionVerb,
    AuthPossession,
    UsePermissions,
} from '@app/unraid-api/graph/directives/use-permissions.directive.js';
import { ApiKey, Permission } from '@app/unraid-api/graph/resolvers/api-key/api-key.model.js';
import { Resource, Role } from '@app/unraid-api/graph/resolvers/base.model.js';
import { PrefixedID } from '@app/unraid-api/graph/scalars/graphql-type-prefixed-id.js';

@Resolver(() => ApiKey)
export class ApiKeyResolver {
    constructor(
        private authService: AuthService,
        private apiKeyService: ApiKeyService
    ) {}

    @Query(() => [ApiKey])
    @UsePermissions({
        action: AuthActionVerb.READ,
        resource: Resource.API_KEY,
        possession: AuthPossession.ANY,
    })
    async apiKeys(): Promise<ApiKey[]> {
        return this.apiKeyService.findAll();
    }

    @Query(() => ApiKey, { nullable: true })
    @UsePermissions({
        action: AuthActionVerb.READ,
        resource: Resource.API_KEY,
        possession: AuthPossession.ANY,
    })
    async apiKey(
        @Args('id', { type: () => PrefixedID })
        id: string
    ): Promise<ApiKey | null> {
        return this.apiKeyService.findById(id);
    }

    @Query(() => [Role], { description: 'All possible roles for API keys' })
    @UsePermissions({
        action: AuthActionVerb.READ,
        resource: Resource.PERMISSION,
        possession: AuthPossession.ANY,
    })
    async apiKeyPossibleRoles(): Promise<Role[]> {
        return Object.values(Role);
    }

    @Query(() => [Permission], { description: 'All possible permissions for API keys' })
    @UsePermissions({
        action: AuthActionVerb.READ,
        resource: Resource.PERMISSION,
        possession: AuthPossession.ANY,
    })
    async apiKeyPossiblePermissions(): Promise<Permission[]> {
        // Build all combinations of Resource and AuthActionVerb
        const resources = Object.values(Resource);
        const actions = Object.values(AuthActionVerb);
        return resources.map((resource) => ({
            resource,
            actions,
        }));
    }
}
