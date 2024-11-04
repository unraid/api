import { type UserAccount } from '@app/graphql/generated/api/types';
import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';

import { ApiKeyService } from './api-key.service';
import { AuthZService } from 'nest-authz';
import { CookieService } from './cookie.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        private usersService: UsersService,
        private cookieService: CookieService,
        private apiKeyService: ApiKeyService,
        private authzService: AuthZService
    ) {}

    async validateUser(apiKey: string): Promise<UserAccount> {
        const user = this.usersService.findOne(apiKey);

        if (user) {
            return user;
        }

        throw new UnauthorizedException('Invalid API key');
    }

    async validateCookies(cookies: object): Promise<UserAccount> {
        if (await this.cookieService.hasValidAuthCookie(cookies)) {
            return this.usersService.getSessionUser();
        }

        throw new UnauthorizedException('No user session found');
    }

    /**------------------------------------------------------------------------
     *                      AuthZService based methods
     *------------------------------------------------------------------------**/

    async validateApiKeyCasbin(apiKey: string): Promise<UserAccount> {
        const apiKeyEntity = await this.apiKeyService.findByKey(apiKey);

        if (!apiKeyEntity) {
            throw new UnauthorizedException('Invalid API key');
        }

        if (!apiKeyEntity.roles) {
            apiKeyEntity.roles = [];
        }

        await this.syncApiKeyRoles(apiKeyEntity.id, apiKeyEntity.roles);
        this.logger.debug(
            `Validating API key with roles: ${JSON.stringify(
                await this.authzService.getRolesForUser(apiKeyEntity.id)
            )}`
        );

        return {
            id: apiKeyEntity.id,
            name: apiKeyEntity.name,
            description: apiKeyEntity.description ?? `API Key ${apiKeyEntity.name}`,
            roles: apiKeyEntity.roles.join(','),
        };
    }

    async validateCookiesCasbin(cookies: object): Promise<UserAccount> {
        if (await this.cookieService.hasValidAuthCookie(cookies)) {
            const user = this.usersService.getSessionUser();

            if (!user) {
                throw new UnauthorizedException('Invalid user session');
            }

            await this.ensureUserRoles(user.id);

            return user;
        }

        throw new UnauthorizedException('No user session found');
    }

    public async syncApiKeyRoles(apiKeyId: string, roles: string[]): Promise<void> {
        try {
            // Remove existing roles
            const existingRoles = await this.authzService.getRolesForUser(apiKeyId);

            for (const role of existingRoles) {
                await this.authzService.deleteRoleForUser(apiKeyId, role);
            }

            // Add current roles
            for (const role of roles) {
                await this.authzService.addRoleForUser(apiKeyId, role);
            }
        } catch (error: unknown) {
            this.logger.error(`Failed to sync roles for API key ${apiKeyId}`, error);
            throw new Error(
                `Failed to sync roles: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }

    public async addPermission(role: string, resource: string, action: string): Promise<boolean> {
        await this.authzService.addPolicy(role, resource, action);

        return true;
    }

    public async addRoleToUser(userId: string, role: string): Promise<boolean> {
        if (!userId || !role) {
            throw new Error('User ID and role are required');
        }

        try {
            const hasRole = await this.authzService.hasRoleForUser(userId, role);

            if (hasRole) {
                return true;
            }

            await this.authzService.addRoleForUser(userId, role);

            return true;
        } catch (error: unknown) {
            this.logger.error(`Failed to check if user ${userId} has role ${role}`, error);
            throw error;
        }
    }

    public async addRoleToApiKey(apiKeyId: string, role: string): Promise<boolean> {
        if (!apiKeyId || !role) {
            throw new Error('API key ID and role are required');
        }

        const apiKey = await this.apiKeyService.findById(apiKeyId);

        if (!apiKey) {
            throw new UnauthorizedException('API key not found');
        }

        if (!apiKey.roles.includes(role)) {
            apiKey.roles.push(role);
            await this.apiKeyService.saveApiKey(apiKey);
            await this.authzService.addRoleForUser(apiKeyId, role);
        }

        return true;
    }

    public async removeRoleFromApiKey(apiKeyId: string, role: string): Promise<boolean> {
        if (!apiKeyId || !role) {
            throw new Error('API key ID and role are required');
        }

        const apiKey = await this.apiKeyService.findById(apiKeyId);

        if (!apiKey) {
            throw new UnauthorizedException('API key not found');
        }

        apiKey.roles = apiKey.roles.filter((r) => r !== role);
        await this.apiKeyService.saveApiKey(apiKey);
        await this.authzService.deleteRoleForUser(apiKeyId, role);

        return true;
    }

    private async ensureUserRoles(userId: string): Promise<void> {
        const existingRoles = await this.authzService.getRolesForUser(userId);

        if (existingRoles.length === 0) {
            await this.authzService.addRoleForUser(userId, 'guest');
        }
    }
}
