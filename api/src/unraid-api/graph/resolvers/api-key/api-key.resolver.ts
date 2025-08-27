import { Args, Query, Resolver } from '@nestjs/graphql';

import { AuthAction, Resource, Role } from '@unraid/shared/graphql.model.js';
import { PrefixedID } from '@unraid/shared/prefixed-id-scalar.js';
import { UsePermissions } from '@unraid/shared/use-permissions.directive.js';

import { ApiKeyService } from '@app/unraid-api/auth/api-key.service.js';
import { ApiKey, Permission } from '@app/unraid-api/graph/resolvers/api-key/api-key.model.js';

@Resolver(() => ApiKey)
export class ApiKeyResolver {
    constructor(private apiKeyService: ApiKeyService) {}

    @Query(() => [ApiKey])
    @UsePermissions({
        action: AuthAction.READ_ANY,
        resource: Resource.API_KEY,
    })
    async apiKeys(): Promise<ApiKey[]> {
        return this.apiKeyService.findAll();
    }

    @Query(() => ApiKey, { nullable: true })
    @UsePermissions({
        action: AuthAction.READ_ANY,
        resource: Resource.API_KEY,
    })
    async apiKey(
        @Args('id', { type: () => PrefixedID })
        id: string
    ): Promise<ApiKey | null> {
        return this.apiKeyService.findById(id);
    }

    @Query(() => [Role], { description: 'All possible roles for API keys' })
    @UsePermissions({
        action: AuthAction.READ_ANY,
        resource: Resource.PERMISSION,
    })
    async apiKeyPossibleRoles(): Promise<Role[]> {
        return Object.values(Role);
    }

    @Query(() => [Permission], { description: 'All possible permissions for API keys' })
    @UsePermissions({
        action: AuthAction.READ_ANY,
        resource: Resource.PERMISSION,
    })
    async apiKeyPossiblePermissions(): Promise<Permission[]> {
        // Build all combinations of Resource and AuthAction
        const resources = Object.values(Resource);
        const actions = Object.values(AuthAction);
        return resources.map((resource) => ({
            resource,
            actions,
        }));
    }
}
