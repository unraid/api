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
    ApiKeyWithSecret,
    CreateApiKeyInput,
    DeleteApiKeyInput,
    RemoveRoleFromApiKeyInput,
} from '@app/unraid-api/graph/resolvers/api-key/api-key.model.js';
import { ApiKeyMutations } from '@app/unraid-api/graph/resolvers/mutation/mutation.model.js';
import { validateObject } from '@app/unraid-api/graph/resolvers/validation.utils.js';

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
    @ResolveField(() => ApiKeyWithSecret, { description: 'Create an API key' })
    async create(@Args('input') unvalidatedInput: CreateApiKeyInput): Promise<ApiKeyWithSecret> {
        const input = await validateObject(CreateApiKeyInput, unvalidatedInput);
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
        const validatedInput = await validateObject(AddRoleForApiKeyInput, input);
        return this.authService.addRoleToApiKey(validatedInput.apiKeyId, Role[validatedInput.role]);
    }

    @UsePermissions({
        action: AuthActionVerb.UPDATE,
        resource: Resource.API_KEY,
        possession: AuthPossession.ANY,
    })
    @ResolveField(() => Boolean, { description: 'Remove a role from an API key' })
    async removeRole(@Args('input') input: RemoveRoleFromApiKeyInput): Promise<boolean> {
        const validatedInput = await validateObject(RemoveRoleFromApiKeyInput, input);
        return this.authService.removeRoleFromApiKey(validatedInput.apiKeyId, Role[validatedInput.role]);
    }

    @UsePermissions({
        action: AuthActionVerb.DELETE,
        resource: Resource.API_KEY,
        possession: AuthPossession.ANY,
    })
    @ResolveField(() => Boolean, { description: 'Delete one or more API keys' })
    async delete(@Args('input') input: DeleteApiKeyInput): Promise<boolean> {
        const validatedInput = await validateObject(DeleteApiKeyInput, input);
        await this.apiKeyService.deleteApiKeys(validatedInput.ids);
        return true;
    }
}
