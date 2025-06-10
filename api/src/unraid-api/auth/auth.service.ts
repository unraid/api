import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';

import { Role } from '@unraid/shared/graphql.model.js';
import { AuthZService } from 'nest-authz';

import { getters } from '@app/store/index.js';
import { ApiKeyService } from '@app/unraid-api/auth/api-key.service.js';
import { CookieService } from '@app/unraid-api/auth/cookie.service.js';
import { Permission } from '@app/unraid-api/graph/resolvers/api-key/api-key.model.js';
import { UserAccount } from '@app/unraid-api/graph/user/user.model.js';
import { FastifyRequest } from '@app/unraid-api/types/fastify.js';
import { batchProcess, handleAuthError } from '@app/utils.js';

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
            await this.syncApiKeyPermissions(apiKeyEntity.id, apiKeyEntity.permissions);
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
                permissions: apiKeyEntity.permissions,
            };
        } catch (error: unknown) {
            handleAuthError(this.logger, 'Failed to validate API key', error);
        }
    }

    async validateCookiesWithCsrfToken(request: FastifyRequest): Promise<UserAccount> {
        try {
            if (
                request.method !== 'GET' &&
                !request.url?.startsWith('/graphql/api/rclone-webgui/') &&
                !this.validateCsrfToken(request.headers['x-csrf-token'] || request.query.csrf_token)
            ) {
                throw new UnauthorizedException('Invalid CSRF token');
            }

            if (!(await this.cookieService.hasValidAuthCookie(request.cookies))) {
                throw new UnauthorizedException('No user session found');
            }

            const user = await this.getSessionUser();

            if (!user) {
                throw new UnauthorizedException('Invalid user session');
            }

            // Sync the user's roles before checking them
            await this.syncUserRoles(user.id, user.roles);

            // Now get the updated roles
            const existingRoles = await this.authzService.getRolesForUser(user.id);
            this.logger.debug(`User ${user.id} has roles: ${existingRoles}`);

            return user;
        } catch (error: unknown) {
            handleAuthError(this.logger, 'Failed to validate session', error);
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
            handleAuthError(this.logger, 'Failed to sync roles for API key', error, { apiKeyId });
        }
    }

    public async syncApiKeyPermissions(apiKeyId: string, permissions: Array<Permission>): Promise<void> {
        try {
            // Clear existing permissions first
            await this.authzService.deletePermissionsForUser(apiKeyId);

            // Create array of permission-action pairs for processing
            const permissionActions = permissions.flatMap((permission) =>
                (permission.actions || []).map((action) => ({
                    resource: permission.resource,
                    action,
                }))
            );

            const { errors, errorOccured } = await batchProcess(
                permissionActions,
                ({ resource, action }) =>
                    this.authzService.addPermissionForUser(apiKeyId, resource, action)
            );

            if (errorOccured) {
                this.logger.warn(`Some permissions failed to sync for API key ${apiKeyId}:`, errors);
            }
        } catch (error: unknown) {
            handleAuthError(this.logger, 'Failed to sync permissions for API key', error, { apiKeyId });
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
            handleAuthError(this.logger, 'Failed to add role to API key', error, { apiKeyId, role });
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
            handleAuthError(this.logger, 'Failed to remove role from API key', error, {
                apiKeyId,
                role,
            });
        }
    }

    private async syncUserRoles(userId: string, roles: Role[]): Promise<void> {
        try {
            // Get existing roles and convert to Set
            const existingRolesSet = new Set(
                (await this.authzService.getRolesForUser(userId)).map((role) => role as Role)
            );
            const newRolesSet = new Set(roles);

            // Calculate roles to add (in new roles but not in existing)
            const rolesToAdd = roles.filter((role) => !existingRolesSet.has(role));

            // Calculate roles to remove (in existing but not in new)
            const rolesToRemove = Array.from(existingRolesSet).filter((role) => !newRolesSet.has(role));

            // Perform role updates
            await Promise.all([
                ...rolesToAdd.map((role) => this.authzService.addRoleForUser(userId, role)),
                ...rolesToRemove.map((role) => this.authzService.deleteRoleForUser(userId, role)),
            ]);

            this.logger.debug(
                `Synced roles for user ${userId}. Added: ${rolesToAdd.join(
                    ','
                )}, Removed: ${rolesToRemove.join(',')}`
            );
        } catch (error: unknown) {
            handleAuthError(this.logger, 'Failed to sync roles for user', error, { userId });
        }
    }

    public validateCsrfToken(token?: string): boolean {
        return Boolean(token) && token === getters.emhttp().var.csrfToken;
    }

    /**
     * Returns a user object representing a session.
     * Note: Does NOT perform validation.
     *
     * @returns a service account that represents the user session (i.e. a webgui user).
     */
    async getSessionUser(): Promise<UserAccount> {
        this.logger.debug('getSessionUser called!');
        return {
            id: '-1',
            description: 'Session receives administrator permissions',
            name: 'admin',
            roles: [Role.ADMIN],
            permissions: [],
        };
    }
}
