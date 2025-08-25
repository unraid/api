import { Args, ResolveField, Resolver } from '@nestjs/graphql';

import { Resource, Role } from '@unraid/shared/graphql.model.js';
import {
    AuthActionVerb,
    AuthPossession,
    UsePermissions,
} from '@unraid/shared/use-permissions.directive.js';

import { ApiKeyService } from '@app/unraid-api/auth/api-key.service.js';
import { AuthService } from '@app/unraid-api/auth/auth.service.js';
import {
    AddRoleForApiKeyInput,
    ApiKey,
    CreateApiKeyInput,
    DeleteApiKeyInput,
    RemoveRoleFromApiKeyInput,
    UpdateApiKeyInput,
} from '@app/unraid-api/graph/resolvers/api-key/api-key.model.js';
import { ApiKeyMutations } from '@app/unraid-api/graph/resolvers/mutation/mutation.model.js';

@Resolver(() => ApiKeyMutations)
export class ApiKeyMutationsResolver {
    constructor(
        private authService: AuthService,
        private apiKeyService: ApiKeyService
    ) {}

    @UsePermissions({
        action: AuthActionVerb.CREATE,
        resource: Resource.API_KEY,
        possession: AuthPossession.ANY,
    })
    @ResolveField(() => ApiKey, { description: 'Create an API key' })
    async create(@Args('input') input: CreateApiKeyInput): Promise<ApiKey> {
        const apiKey = await this.apiKeyService.create({
            name: input.name,
            description: input.description ?? undefined,
            roles: input.roles ?? [],
            permissions: input.permissions ?? [],
            overwrite: input.overwrite ?? false,
        });
        await this.authService.syncApiKeyRoles(apiKey.id, apiKey.roles);
        return apiKey;
    }

    @UsePermissions({
        action: AuthActionVerb.UPDATE,
        resource: Resource.API_KEY,
        possession: AuthPossession.ANY,
    })
    @ResolveField(() => Boolean, { description: 'Add a role to an API key' })
    async addRole(@Args('input') input: AddRoleForApiKeyInput): Promise<boolean> {
        return this.authService.addRoleToApiKey(input.apiKeyId, Role[input.role]);
    }

    @UsePermissions({
        action: AuthActionVerb.UPDATE,
        resource: Resource.API_KEY,
        possession: AuthPossession.ANY,
    })
    @ResolveField(() => Boolean, { description: 'Remove a role from an API key' })
    async removeRole(@Args('input') input: RemoveRoleFromApiKeyInput): Promise<boolean> {
        return this.authService.removeRoleFromApiKey(input.apiKeyId, Role[input.role]);
    }

    @UsePermissions({
        action: AuthActionVerb.DELETE,
        resource: Resource.API_KEY,
        possession: AuthPossession.ANY,
    })
    @ResolveField(() => Boolean, { description: 'Delete one or more API keys' })
    async delete(@Args('input') input: DeleteApiKeyInput): Promise<boolean> {
        await this.apiKeyService.deleteApiKeys(input.ids);
        return true;
    }

    @UsePermissions({
        action: AuthActionVerb.UPDATE,
        resource: Resource.API_KEY,
        possession: AuthPossession.ANY,
    })
    @ResolveField(() => ApiKey, { description: 'Update an API key' })
    async update(@Args('input') input: UpdateApiKeyInput): Promise<ApiKey> {
        const apiKey = await this.apiKeyService.update(input);
        await this.authService.syncApiKeyRoles(apiKey.id, apiKey.roles);
        return apiKey;
    }
}
