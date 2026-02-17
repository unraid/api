import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { timingSafeEqual } from 'node:crypto';

import { AuthAction, Resource, Role } from '@unraid/shared/graphql.model.js';
import {
    convertPermissionSetsToArrays,
    expandWildcardAction,
    parseActionToAuthAction,
    reconcileWildcardPermissions,
} from '@unraid/shared/util/permissions.js';
import { AuthZService } from 'nest-authz';

import { getters } from '@app/store/index.js';
import { ApiKeyService } from '@app/unraid-api/auth/api-key.service.js';
import { CookieService } from '@app/unraid-api/auth/cookie.service.js';
import { LocalSessionService } from '@app/unraid-api/auth/local-session.service.js';
import { Permission } from '@app/unraid-api/graph/resolvers/api-key/api-key.model.js';
import { UserAccount } from '@app/unraid-api/graph/user/user.model.js';
import { FastifyRequest } from '@app/unraid-api/types/fastify.js';
import { batchProcess, handleAuthError } from '@app/utils.js';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    private logTrace(message: string): void {
        const traceLogger = this.logger as unknown as { trace?: (msg: string) => void };
        if (typeof traceLogger.trace === 'function') {
            traceLogger.trace(message);
            return;
        }
        this.logger.verbose(message);
    }

    constructor(
        private cookieService: CookieService,
        private apiKeyService: ApiKeyService,
        private localSessionService: LocalSessionService,
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
            this.logTrace(`User ${user.id} has roles: ${existingRoles}`);

            return user;
        } catch (error: unknown) {
            handleAuthError(this.logger, 'Failed to validate session', error);
        }
    }

    async validateLocalSession(localSessionToken: string): Promise<UserAccount> {
        try {
            const isValid = await this.localSessionService.validateLocalSession(localSessionToken);

            if (!isValid) {
                throw new UnauthorizedException('Invalid local session token');
            }

            // Local session has admin privileges
            const user = await this.getLocalSessionUser();

            // Sync the user's roles before checking them
            await this.syncUserRoles(user.id, user.roles);

            // Now get the updated roles
            const existingRoles = await this.authzService.getRolesForUser(user.id);
            this.logTrace(`Local session user ${user.id} has roles: ${existingRoles}`);

            return user;
        } catch (error: unknown) {
            handleAuthError(this.logger, 'Failed to validate local session', error);
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
            // Filter out any permissions with empty or undefined resources
            const permissionActions = permissions
                .filter((permission) => permission.resource && permission.resource.trim() !== '')
                .flatMap((permission) =>
                    (permission.actions || [])
                        .filter((action) => action && String(action).trim() !== '')
                        .flatMap((action) => {
                            const actionStr = String(action);
                            // Handle wildcard - expand to all CRUD actions
                            if (actionStr === '*' || actionStr.toLowerCase() === '*') {
                                return expandWildcardAction().map((expandedAction) => ({
                                    resource: permission.resource,
                                    action: expandedAction,
                                }));
                            }

                            // Use the shared helper to parse and validate the action
                            const parsedAction = parseActionToAuthAction(actionStr);

                            // Only include valid AuthAction values
                            return parsedAction
                                ? [
                                      {
                                          resource: permission.resource,
                                          action: parsedAction,
                                      },
                                  ]
                                : [];
                        })
                );

            const { errors, errorOccurred: errorOccured } = await batchProcess(
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
            if (!apiKey.roles) {
                apiKey.roles = [];
            }
            if (!apiKey.roles.includes(role)) {
                apiKey.roles.push(role);
                await this.apiKeyService.saveApiKey(apiKey);
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
            if (!apiKey.roles) {
                apiKey.roles = [];
            }
            apiKey.roles = apiKey.roles.filter((r) => r !== role);
            await this.apiKeyService.saveApiKey(apiKey);
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

            this.logTrace(
                `Synced roles for user ${userId}. Added: ${rolesToAdd.join(
                    ','
                )}, Removed: ${rolesToRemove.join(',')}`
            );
        } catch (error: unknown) {
            handleAuthError(this.logger, 'Failed to sync roles for user', error, { userId });
        }
    }

    public validateCsrfToken(token?: string): boolean {
        if (!token) return false;
        const csrfToken = getters.emhttp().var.csrfToken;
        if (!csrfToken) return false;
        return timingSafeEqual(Buffer.from(token, 'utf-8'), Buffer.from(csrfToken, 'utf-8'));
    }

    /**
     * Get implicit permissions for a role (including inherited permissions)
     */
    public async getImplicitPermissionsForRole(role: Role): Promise<Map<Resource, AuthAction[]>> {
        // Use Set internally for efficient deduplication, with '*' as a special key for wildcards
        const permissionsWithSets = new Map<Resource | '*', Set<AuthAction>>();

        // Load permissions from Casbin, defaulting to empty array on error
        let casbinPermissions: string[][] = [];
        try {
            casbinPermissions = await this.authzService.getImplicitPermissionsForUser(role);
        } catch (error) {
            this.logger.error(`Failed to get permissions for role ${role}:`, error);
        }

        // Parse the Casbin permissions format: [["role", "resource", "action"], ...]
        for (const perm of casbinPermissions) {
            if (perm.length < 3) continue;

            const resourceStr = perm[1];
            const action = perm[2];

            if (!resourceStr) continue;

            // Skip invalid resources (except wildcard)
            if (resourceStr !== '*' && !Object.values(Resource).includes(resourceStr as Resource)) {
                this.logger.debug(`Skipping invalid resource from Casbin: ${resourceStr}`);
                continue;
            }

            // Initialize Set if needed
            if (!permissionsWithSets.has(resourceStr as Resource | '*')) {
                permissionsWithSets.set(resourceStr as Resource | '*', new Set());
            }

            const actionsSet = permissionsWithSets.get(resourceStr as Resource | '*')!;

            // Handle wildcard or parse to valid AuthAction
            if (action === '*') {
                // Expand wildcard action to CRUD operations
                expandWildcardAction().forEach((a) => actionsSet.add(a));
            } else {
                // Use shared helper to parse and validate action
                const parsedAction = parseActionToAuthAction(action);
                if (parsedAction) {
                    actionsSet.add(parsedAction);
                } else {
                    this.logger.debug(`Skipping invalid action from Casbin: ${action}`);
                }
            }
        }

        // Reconcile wildcard permissions and convert to final format
        reconcileWildcardPermissions(permissionsWithSets);
        return convertPermissionSetsToArrays(permissionsWithSets);
    }

    /**
     * Returns a user object representing a session.
     * Note: Does NOT perform validation.
     *
     * @returns a service account that represents the user session (i.e. a webgui user).
     */
    async getSessionUser(): Promise<UserAccount> {
        this.logger.verbose('getSessionUser called!');
        return {
            id: '-1',
            description: 'Session receives administrator permissions',
            name: 'admin',
            roles: [Role.ADMIN],
            permissions: [],
        };
    }

    /**
     * Returns a user object representing a local session.
     * Note: Does NOT perform validation.
     *
     * @returns a service account that represents the local session user (i.e. CLI/system operations).
     */
    async getLocalSessionUser(): Promise<UserAccount> {
        this.logger.verbose('getLocalSessionUser called!');
        return {
            id: '-2',
            description: 'Local session receives administrator permissions for CLI/system operations',
            name: 'local-admin',
            roles: [Role.ADMIN],
            permissions: [],
        };
    }
}
