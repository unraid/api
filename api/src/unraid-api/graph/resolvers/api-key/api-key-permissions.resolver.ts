import { Injectable } from '@nestjs/common';
import { Args, Query, Resolver } from '@nestjs/graphql';

import { Resource, Role } from '@unraid/shared/graphql.model.js';
import { AuthActionVerb, AuthPossession, UsePermissions } from 'nest-authz';

import { AuthService } from '@app/unraid-api/auth/auth.service.js';
import {
    AddPermissionInput,
    Permission,
} from '@app/unraid-api/graph/resolvers/api-key/api-key.model.js';

@Injectable()
@Resolver()
export class ApiKeyPermissionsResolver {
    constructor(private authService: AuthService) {}

    @Query(() => [Permission], {
        description: 'Get the actual permissions that would be granted by a set of roles',
    })
    @UsePermissions({
        action: AuthActionVerb.READ,
        resource: Resource.PERMISSION,
        possession: AuthPossession.ANY,
    })
    async getPermissionsForRoles(
        @Args('roles', { type: () => [Role] }) roles: Role[]
    ): Promise<Permission[]> {
        // Get the implicit permissions for each role from Casbin
        const allPermissions = new Map<Resource, Set<string>>();

        for (const role of roles) {
            // Query Casbin for what permissions this role actually has
            const rolePermissions = await this.authService.getImplicitPermissionsForRole(role);

            for (const [resource, actions] of rolePermissions) {
                if (!allPermissions.has(resource)) {
                    allPermissions.set(resource, new Set());
                }
                const resourceActions = allPermissions.get(resource)!;
                actions.forEach((action) => resourceActions.add(action));
            }
        }

        // Convert to Permission array
        const permissions: Permission[] = [];
        for (const [resource, actions] of allPermissions) {
            permissions.push({
                resource,
                actions: Array.from(actions),
            });
        }

        return permissions;
    }

    @Query(() => [Permission], {
        description:
            'Preview the effective permissions for a combination of roles and explicit permissions',
    })
    @UsePermissions({
        action: AuthActionVerb.READ,
        resource: Resource.PERMISSION,
        possession: AuthPossession.ANY,
    })
    async previewEffectivePermissions(
        @Args('roles', { type: () => [Role], nullable: true }) roles?: Role[],
        @Args('permissions', { type: () => [AddPermissionInput], nullable: true })
        permissions?: AddPermissionInput[]
    ): Promise<Permission[]> {
        const effectivePermissions = new Map<Resource, Set<string>>();

        // Add permissions from roles
        if (roles && roles.length > 0) {
            for (const role of roles) {
                const rolePermissions = await this.authService.getImplicitPermissionsForRole(role);

                for (const [resource, actions] of rolePermissions) {
                    if (!effectivePermissions.has(resource)) {
                        effectivePermissions.set(resource, new Set());
                    }
                    const resourceActions = effectivePermissions.get(resource)!;
                    actions.forEach((action) => resourceActions.add(action));
                }
            }
        }

        // Add explicit permissions
        if (permissions && permissions.length > 0) {
            for (const perm of permissions) {
                if (!effectivePermissions.has(perm.resource)) {
                    effectivePermissions.set(perm.resource, new Set());
                }
                const resourceActions = effectivePermissions.get(perm.resource)!;
                perm.actions.forEach((action) => resourceActions.add(action));
            }
        }

        // Convert to Permission array
        const result: Permission[] = [];
        for (const [resource, actions] of effectivePermissions) {
            result.push({
                resource,
                actions: Array.from(actions),
            });
        }

        return result;
    }
}
