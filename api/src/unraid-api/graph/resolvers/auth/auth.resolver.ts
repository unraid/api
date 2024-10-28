import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';

import { AuthService } from '@app/unraid-api/auth/auth.service';
import { ApiKeyService } from '@app/unraid-api/auth/api-key.service';
import { GraphqlAuthGuard } from '@app/unraid-api/auth/auth.guard';

@Resolver('Auth')
@UseGuards(GraphqlAuthGuard)
export class AuthResolver {
    constructor(
        private authService: AuthService,
        private apiKeyService: ApiKeyService
    ) {}

    @Query()
    async apiKeys() {
        return this.apiKeyService.findAll();
    }

    @Query()
    async apiKey(@Args('id') id: string) {
        return this.apiKeyService.findById(id);
    }

    @Mutation()
    async createApiKey(
        @Args('input')
        input: {
            name: string;
            description: string;
            roles: string[];
        }
    ) {
        const apiKey = await this.apiKeyService.create(input.name, input.description, input.roles);

        // Sync the roles with Casbin when creating
        await this.authService.syncApiKeyRoles(apiKey.id, apiKey.roles);

        return apiKey;
    }

    @Mutation()
    async addPermission(
        @Args('input')
        input: {
            role: string;
            resource: string;
            action: string;
        }
    ) {
        await this.authService.addPermission(input.role, input.resource, input.action);

        return true;
    }

    @Mutation()
    async addRoleForUser(
        @Args('input')
        input: {
            userId: string;
            role: string;
        }
    ) {
        return this.authService.addRoleToUser(input.userId, input.role);
    }

    @Mutation()
    async addRoleForApiKey(
        @Args('input')
        input: {
            apiKeyId: string;
            role: string;
        }
    ) {
        return this.authService.addRoleToApiKey(input.apiKeyId, input.role);
    }

    @Mutation()
    async removeRoleFromApiKey(
        @Args('input')
        input: {
            apiKeyId: string;
            role: string;
        }
    ) {
        return this.authService.removeRoleFromApiKey(input.apiKeyId, input.role);
    }
}
