import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';

import { AuthZService } from 'nest-authz';

import type { UserAccount } from '@app/graphql/generated/api/types';
import { Role } from '@app/graphql/generated/api/types';
import { handleAuthError } from '@app/utils';

import { ApiKeyService } from './api-key.service';
import { CookieService } from './cookie.service';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        private cookieService: CookieService,
        private apiKeyService: ApiKeyService,
        private authzService: AuthZService
    ) {}

    async validateApiKeyCasbin(apiKey: string): Promise<UserAccount> {
        try {
            const apiKeyEntity = await this.apiKeyService.findByKey(apiKey);

            if (!apiKeyEntity) {
                throw new UnauthorizedException('Invalid API key');
            }

            apiKeyEntity.roles ??= [];

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
                roles: apiKeyEntity.roles,
            };
        } catch (error: unknown) {
            handleAuthError(this.logger, 'validate API key', error);
        }
    }

    async validateCookiesCasbin(cookies: object): Promise<UserAccount> {
        try {
            if (!(await this.cookieService.hasValidAuthCookie(cookies))) {
                throw new UnauthorizedException('No user session found');
            }

            const user = this.getSessionUser();

            if (!user) {
                throw new UnauthorizedException('Invalid user session');
            }

            await this.ensureUserRoles(user.id);

            return user;
        } catch (error: unknown) {
            handleAuthError(this.logger, 'validate session', error);
        }
    }

    public async syncApiKeyRoles(apiKeyId: string, roles: string[]): Promise<void> {
        try {
            // Get existing roles and convert to Set
            const existingRolesSet = new Set(await this.authzService.getRolesForUser(apiKeyId));
            const newRolesSet = new Set(roles);

            // Calculate roles to add (in new roles but not in existing)
            const rolesToAdd = roles.filter((role) => !existingRolesSet.has(role));

            // Calculate roles to remove (in existing but not in new)
            const rolesToRemove = Array.from(existingRolesSet).filter((role) => !newRolesSet.has(role));

            // Perform role updates
            await Promise.all([
                ...rolesToAdd.map((role) => this.authzService.addRoleForUser(apiKeyId, role)),
                ...rolesToRemove.map((role) => this.authzService.deleteRoleForUser(apiKeyId, role)),
            ]);
        } catch (error: unknown) {
            handleAuthError(this.logger, 'sync roles for API key', error, { apiKeyId });
        }
    }

    public async addRoleToUser(userId: string, role: Role): Promise<boolean> {
        if (!userId || !role) {
            throw new UnauthorizedException('User ID and role are required');
        }

        try {
            const hasRole = await this.authzService.hasRoleForUser(userId, role);

            if (hasRole) {
                return true;
            }

            await this.authzService.addRoleForUser(userId, role);

            return true;
        } catch (error: unknown) {
            handleAuthError(this.logger, 'add role to user', error, { userId, role });
        }
    }

    public async addRoleToApiKey(apiKeyId: string, role: Role): Promise<boolean> {
        if (!apiKeyId || !role) {
            throw new UnauthorizedException('API key ID and role are required');
        }

        const apiKey = await this.apiKeyService.findById(apiKeyId);

        if (!apiKey) {
            throw new UnauthorizedException('API key not found');
        }

        try {
            if (!apiKey.roles.includes(role)) {
                const apiKeyWithSecret = await this.apiKeyService.findByIdWithSecret(apiKeyId);

                if (!apiKeyWithSecret) {
                    throw new UnauthorizedException('API key not found with secret');
                }

                apiKeyWithSecret.roles.push(role);
                await this.apiKeyService.saveApiKey(apiKeyWithSecret);
                await this.authzService.addRoleForUser(apiKeyId, role);
            }

            return true;
        } catch (error: unknown) {
            handleAuthError(this.logger, 'add role to API key', error, { apiKeyId, role });
        }
    }

    public async removeRoleFromApiKey(apiKeyId: string, role: Role): Promise<boolean> {
        if (!apiKeyId || !role) {
            throw new UnauthorizedException('API key ID and role are required');
        }

        const apiKey = await this.apiKeyService.findById(apiKeyId);

        if (!apiKey) {
            throw new UnauthorizedException('API key not found');
        }

        try {
            const apiKeyWithSecret = await this.apiKeyService.findByIdWithSecret(apiKeyId);

            if (!apiKeyWithSecret) {
                throw new UnauthorizedException('API key not found with secret');
            }

            apiKeyWithSecret.roles = apiKeyWithSecret.roles.filter((r) => r !== role);
            await this.apiKeyService.saveApiKey(apiKeyWithSecret);
            await this.authzService.deleteRoleForUser(apiKeyId, role);

            return true;
        } catch (error: unknown) {
            handleAuthError(this.logger, 'remove role from API key', error, { apiKeyId, role });
        }
    }

    private async ensureUserRoles(userId: string): Promise<void> {
        try {
            const existingRoles = await this.authzService.getRolesForUser(userId);

            if (existingRoles.length === 0) {
                await this.authzService.addRoleForUser(userId, 'guest');
                this.logger.debug(`Added default 'guest' role to user ${userId}`);
            }
        } catch (error: unknown) {
            handleAuthError(this.logger, 'ensure roles for user', error, { userId });
        }
    }

    /**
     * Returns a user object representing a session.
     * Note: Does NOT perform validation.
     *
     * @returns a service account that represents the user session (i.e. a webgui user).
     */
    getSessionUser(): UserAccount {
        return {
            id: '-1',
            description: 'UPC service account',
            name: 'upc',
            roles: [Role.UPC],
        };
    }
}
