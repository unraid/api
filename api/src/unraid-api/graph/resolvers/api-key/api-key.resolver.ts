import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';

import { AuthActionVerb, AuthPossession, UsePermissions } from 'nest-authz';

import { ApiKeyService } from '@app/unraid-api/auth/api-key.service.js';
import { AuthService } from '@app/unraid-api/auth/auth.service.js';

import { Resource, Role } from '../base.model.js';
import { validateObject } from '../validation.utils.js';
import {
    AddRoleForApiKeyInput,
    ApiKey,
    ApiKeyWithSecret,
    CreateApiKeyInput,
    RemoveRoleFromApiKeyInput,
} from './api-key.model.js';

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
    async apiKey(@Args('id') id: string): Promise<ApiKey | null> {
        return this.apiKeyService.findById(id);
    }

    @Mutation(() => ApiKeyWithSecret)
    @UsePermissions({
        action: AuthActionVerb.CREATE,
        resource: Resource.API_KEY,
        possession: AuthPossession.ANY,
    })
    async createApiKey(
        @Args('input')
        unvalidatedInput: CreateApiKeyInput
    ): Promise<ApiKeyWithSecret> {
        // Validate the input using class-validator
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

    @Mutation(() => Boolean)
    @UsePermissions({
        action: AuthActionVerb.UPDATE,
        resource: Resource.API_KEY,
        possession: AuthPossession.ANY,
    })
    async addRoleForApiKey(
        @Args('input')
        input: AddRoleForApiKeyInput
    ): Promise<boolean> {
        // Validate the input using class-validator
        const validatedInput = await validateObject(AddRoleForApiKeyInput, input);

        return this.authService.addRoleToApiKey(validatedInput.apiKeyId, Role[validatedInput.role]);
    }

    @Mutation(() => Boolean)
    @UsePermissions({
        action: AuthActionVerb.UPDATE,
        resource: Resource.API_KEY,
        possession: AuthPossession.ANY,
    })
    async removeRoleFromApiKey(
        @Args('input')
        input: RemoveRoleFromApiKeyInput
    ): Promise<boolean> {
        // Validate the input using class-validator
        const validatedInput = await validateObject(RemoveRoleFromApiKeyInput, input);
        return this.authService.removeRoleFromApiKey(validatedInput.apiKeyId, Role[validatedInput.role]);
    }
}
