import { type UserAccount } from '@app/graphql/generated/api/types';
import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';

import { ApiKeyService } from './api-key.service';
import { AuthZService } from 'nest-authz';
import { CookieService } from './cookie.service';
import { UsersService } from '@app/unraid-api/users/users.service';

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
        // Bypass variable check for development
        if (process.env.BYPASS_PERMISSION_CHECKS === 'true') {
            this.logger.warn('BYPASSING_PERMISSION_CHECK');

            return {
                id: '-1',
                name: 'BYPASS_PERMISSION_CHECK',
                description: 'BYPASS_PERMISSION_CHECK',
                roles: 'admin',
            };
        }

        const apiKeyEntity = await this.apiKeyService.findByKey(apiKey);

        if (!apiKeyEntity) {
            throw new UnauthorizedException('Invalid API key');
        }

        await this.syncApiKeyRoles(apiKeyEntity.id, apiKeyEntity.roles);

        return {
            id: apiKeyEntity.id,
            name: apiKeyEntity.name,
            description: apiKeyEntity.description ?? `API Key ${apiKeyEntity.name}`,
            roles: apiKeyEntity.roles.join(','),
        };
    }

    async validateCookiesCasbin(cookies: object): Promise<UserAccount> {
        if (await this.cookieService.hasValidAuthCookie(cookies)) {
            const user = await this.usersService.getSessionUser();

            await this.ensureUserRoles(user.id);

            return user;
        }

        throw new UnauthorizedException('No user session found');
    }

    public async syncApiKeyRoles(apiKeyId: string, roles: string[]): Promise<void> {
        // Remove existing roles
        const existingRoles = await this.authzService.getRolesForUser(apiKeyId);

        for (const role of existingRoles) {
            await this.authzService.deleteRoleForUser(apiKeyId, role);
        }

        // Add current roles
        for (const role of roles) {
            await this.authzService.addRoleForUser(apiKeyId, role);
        }
    }

    public async addPermission(role: string, resource: string, action: string): Promise<boolean> {
        await this.authzService.addPolicy(role, resource, action);

        return true;
    }

    public async addRoleToUser(userId: string, role: string): Promise<boolean> {
        await this.authzService.addRoleForUser(userId, role);

        return true;
    }

    public async addRoleToApiKey(apiKeyId: string, role: string): Promise<boolean> {
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
