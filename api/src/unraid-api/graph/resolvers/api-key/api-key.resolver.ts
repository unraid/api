import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';

import { AuthActionVerb, AuthPossession, UsePermissions } from 'nest-authz';

import type {
    AddRoleForApiKeyInput,
    ApiKey,
    ApiKeyWithSecret,
    CreateApiKeyInput,
    RemoveRoleFromApiKeyInput,
} from '@app/graphql/generated/api/types.js';
import { Resource, Role } from '@app/graphql/generated/api/types.js';
import { ApiKeyService } from '@app/unraid-api/auth/api-key.service.js';
import { AuthService } from '@app/unraid-api/auth/auth.service.js';

@Resolver('ApiKey')
export class ApiKeyResolver {
    constructor(
        private authService: AuthService,
        private apiKeyService: ApiKeyService
    ) {}

    @Query()
    @UsePermissions({
        action: AuthActionVerb.READ,
        resource: Resource.API_KEY,
        possession: AuthPossession.ANY,
    })
    async apiKeys(): Promise<ApiKey[]> {
        return this.apiKeyService.findAll();
    }

    @Query()
    @UsePermissions({
        action: AuthActionVerb.READ,
        resource: Resource.API_KEY,
        possession: AuthPossession.ANY,
    })
    async apiKey(@Args('id') id: string): Promise<ApiKey | null> {
        return this.apiKeyService.findById(id);
    }

    @Mutation()
    @UsePermissions({
        action: AuthActionVerb.CREATE,
        resource: Resource.API_KEY,
        possession: AuthPossession.ANY,
    })
    async createApiKey(
        @Args('input')
        input: CreateApiKeyInput
    ): Promise<ApiKeyWithSecret> {
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

    @Mutation()
    @UsePermissions({
        action: AuthActionVerb.UPDATE,
        resource: Resource.API_KEY,
        possession: AuthPossession.ANY,
    })
    async addRoleForApiKey(
        @Args('input')
        input: AddRoleForApiKeyInput
    ): Promise<boolean> {
        return this.authService.addRoleToApiKey(input.apiKeyId, Role[input.role]);
    }

    @Mutation()
    @UsePermissions({
        action: AuthActionVerb.UPDATE,
        resource: Resource.API_KEY,
        possession: AuthPossession.ANY,
    })
    async removeRoleFromApiKey(
        @Args('input')
        input: RemoveRoleFromApiKeyInput
    ): Promise<boolean> {
        return this.authService.removeRoleFromApiKey(input.apiKeyId, Role[input.role]);
    }
}
