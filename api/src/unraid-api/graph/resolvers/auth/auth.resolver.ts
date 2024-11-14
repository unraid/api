import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';

import { GraphQLError } from 'graphql';
import { AuthPossession, UsePermissions } from 'nest-authz';

import type {
    AddPermissionInput,
    AddRoleForApiKeyInput,
    AddRoleForUserInput,
    ApiKey,
    ApiKeyWithSecret,
    CreateApiKeyInput,
    RemoveRoleFromApiKeyInput,
} from '@app/graphql/generated/api/types';
import { Action, Resource, Role } from '@app/graphql/generated/api/types';
import { ApiKeyService } from '@app/unraid-api/auth/api-key.service';
import { GraphqlAuthGuard } from '@app/unraid-api/auth/auth.guard';
import { AuthService } from '@app/unraid-api/auth/auth.service';

@Resolver('Auth')
@UseGuards(GraphqlAuthGuard)
export class AuthResolver {
    constructor(
        private authService: AuthService,
        private apiKeyService: ApiKeyService
    ) {}

    @Query()
    @UsePermissions({
        action: Action.READ,
        resource: Resource.API_KEY,
        possession: AuthPossession.ANY,
    })
    async apiKeys(): Promise<ApiKey[]> {
        return this.apiKeyService.findAll();
    }

    @Query()
    @UsePermissions({
        action: Action.READ,
        resource: Resource.API_KEY,
        possession: AuthPossession.ANY,
    })
    async apiKey(@Args('id') id: string): Promise<ApiKey | null> {
        return this.apiKeyService.findById(id);
    }

    @Mutation()
    @UsePermissions({
        action: Action.CREATE,
        resource: Resource.API_KEY,
        possession: AuthPossession.ANY,
    })
    async createApiKey(
        @Args('input')
        input: CreateApiKeyInput
    ): Promise<ApiKeyWithSecret> {
        const apiKey = await this.apiKeyService.create(
            input.name,
            input.description ?? undefined,
            input.roles
        );

        await this.authService.syncApiKeyRoles(apiKey.id, apiKey.roles);

        return apiKey;
    }

    @Mutation()
    @UsePermissions({
        action: Action.CREATE,
        resource: Resource.PERMISSION,
        possession: AuthPossession.ANY,
    })
    async addPermission(
        @Args('input')
        input: AddPermissionInput
    ): Promise<boolean> {
        try {
            await this.authService.addPermission(
                Role[input.role],
                Resource[input.resource],
                Action[input.action]
            );

            return true;
        } catch (error) {
            throw new GraphQLError('Failed to add permission');
        }
    }

    @Mutation()
    @UsePermissions({
        action: Action.UPDATE,
        resource: Resource.PERMISSION,
        possession: AuthPossession.ANY,
    })
    async addRoleForUser(
        @Args('input')
        input: AddRoleForUserInput
    ): Promise<boolean> {
        return this.authService.addRoleToUser(input.userId, Role[input.role]);
    }

    @Mutation()
    @UsePermissions({
        action: Action.UPDATE,
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
        action: Action.UPDATE,
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
