import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { GraphQLError } from 'graphql';
import { UseGuards } from '@nestjs/common';
import { UsePermissions } from 'nest-authz';
import { ThrottlerGuard } from '@nestjs/throttler';

import { AuthService } from '@app/unraid-api/auth/auth.service';
import { ApiKeyService } from '@app/unraid-api/auth/api-key.service';
import { GraphqlAuthGuard } from '@app/unraid-api/auth/auth.guard';
import {
    type AddPermissionInput,
    type AddRoleForApiKeyInput,
    type AddRoleForUserInput,
    type ApiKey,
    type ApiKeyWithSecret,
    type CreateApiKeyInput,
    type RemoveRoleFromApiKeyInput,
    Role,
} from '@app/graphql/generated/api/types';

@Resolver('Auth')
@UseGuards(GraphqlAuthGuard, ThrottlerGuard)
export class AuthResolver {
    constructor(
        private authService: AuthService,
        private apiKeyService: ApiKeyService
    ) {}

    @Query()
    @UsePermissions({
        action: 'read',
        resource: 'apikey',
    })
    async apiKeys(): Promise<ApiKey[]> {
        return this.apiKeyService.findAll();
    }

    @Query()
    @UsePermissions({
        action: 'read',
        resource: 'apikey',
    })
    async apiKey(@Args('id') id: string): Promise<ApiKey | null> {
        return this.apiKeyService.findById(id);
    }

    @Mutation()
    @UsePermissions({
        action: 'create',
        resource: 'apikey',
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
        action: 'create',
        resource: 'permission',
    })
    async addPermission(
        @Args('input')
        input: AddPermissionInput
    ): Promise<boolean> {
        try {
            await this.authService.addPermission(Role[input.role], input.resource, input.action);

            return true;
        } catch (error) {
            throw new GraphQLError('Failed to add permission');
        }
    }

    @Mutation()
    @UsePermissions({
        action: 'create',
        resource: 'permission',
    })
    async addRoleForUser(
        @Args('input')
        input: AddRoleForUserInput
    ): Promise<boolean> {
        return this.authService.addRoleToUser(input.userId, Role[input.role]);
    }

    @Mutation()
    @UsePermissions({
        action: 'update',
        resource: 'apikey',
    })
    async addRoleForApiKey(
        @Args('input')
        input: AddRoleForApiKeyInput
    ): Promise<boolean> {
        return this.authService.addRoleToApiKey(input.apiKeyId, Role[input.role]);
    }

    @Mutation()
    @UsePermissions({
        action: 'update',
        resource: 'apikey',
    })
    async removeRoleFromApiKey(
        @Args('input')
        input: RemoveRoleFromApiKeyInput
    ): Promise<boolean> {
        return this.authService.removeRoleFromApiKey(input.apiKeyId, Role[input.role]);
    }
}
