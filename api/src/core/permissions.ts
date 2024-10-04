import { apiLogger } from '@app/core/log';
import { RolesBuilder } from 'nest-access-control';

export interface Permission {
    role?: string;
    resource: string;
    action: string;
    attributes: string;
}
export interface Role {
    permissions: Array<Permission>;
    extends?: string;
}

// Use built in permissions
const roles: Record<string, Role> = {
    admin: {
        extends: 'guest',
        permissions: [
            { resource: 'apikey', action: 'read:any', attributes: '*' },
            { resource: 'cloud', action: 'read:own', attributes: '*' },
            { resource: 'config', action: 'update:own', attributes: '*' },
            { resource: 'config', action: 'read:any', attributes: '*' },
            { resource: 'connect', action: 'read:own', attributes: '*' },
            { resource: 'connect', action: 'update:own', attributes: '*' },
            { resource: 'customizations', action: 'read:any', attributes: '*' },
            { resource: 'array', action: 'read:any', attributes: '*' },
            { resource: 'cpu', action: 'read:any', attributes: '*' },
            {
                resource: 'crash-reporting-enabled',
                action: 'read:any',
                attributes: '*',
            },
            { resource: 'device', action: 'read:any', attributes: '*' },
            {
                resource: 'device/unassigned',
                action: 'read:any',
                attributes: '*',
            },
            { resource: 'disk', action: 'read:any', attributes: '*' },
            { resource: 'disk/settings', action: 'read:any', attributes: '*' },
            { resource: 'display', action: 'read:any', attributes: '*' },
            {
                resource: 'docker/container',
                action: 'read:any',
                attributes: '*',
            },
            { resource: 'docker/network', action: 'read:any', attributes: '*' },
            { resource: 'flash', action: 'read:any', attributes: '*' },
            { resource: 'info', action: 'read:any', attributes: '*' },
            { resource: 'license-key', action: 'read:any', attributes: '*' },
            { resource: 'logs', action: 'read:any', attributes: '*' },
            { resource: 'machine-id', action: 'read:any', attributes: '*' },
            { resource: 'memory', action: 'read:any', attributes: '*' },
            { resource: 'notifications', action: 'read:any', attributes: '*' },
            {
                resource: 'notifications',
                action: 'create:any',
                attributes: '*',
            },
            { resource: 'online', action: 'read:any', attributes: '*' },
            { resource: 'os', action: 'read:any', attributes: '*' },
            { resource: 'owner', action: 'read:any', attributes: '*' },
            { resource: 'parity-history', action: 'read:any', attributes: '*' },
            { resource: 'permission', action: 'read:any', attributes: '*' },
            { resource: 'registration', action: 'read:any', attributes: '*' },
            { resource: 'servers', action: 'read:any', attributes: '*' },
            { resource: 'service', action: 'read:any', attributes: '*' },
            {
                resource: 'service/emhttpd',
                action: 'read:any',
                attributes: '*',
            },
            {
                resource: 'service/unraid-api',
                action: 'read:any',
                attributes: '*',
            },
            { resource: 'services', action: 'read:any', attributes: '*' },
            { resource: 'share', action: 'read:any', attributes: '*' },
            {
                resource: 'software-versions',
                action: 'read:any',
                attributes: '*',
            },
            { resource: 'unraid-version', action: 'read:any', attributes: '*' },
            { resource: 'uptime', action: 'read:any', attributes: '*' },
            { resource: 'user', action: 'read:any', attributes: '*' },
            { resource: 'vars', action: 'read:any', attributes: '*' },
            { resource: 'vms', action: 'read:any', attributes: '*' },
            { resource: 'vms/domain', action: 'read:any', attributes: '*' },
            { resource: 'vms/network', action: 'read:any', attributes: '*' },
        ],
    },
    upc: {
        extends: 'guest',
        permissions: [
            { resource: 'apikey', action: 'read:own', attributes: '*' },
            { resource: 'cloud', action: 'read:own', attributes: '*' },
            { resource: 'config', action: 'read:any', attributes: '*' },
            {
                resource: 'crash-reporting-enabled',
                action: 'read:any',
                attributes: '*',
            },
            { resource: 'customizations', action: 'read:any', attributes: '*' },
            { resource: 'disk', action: 'read:any', attributes: '*' },
            { resource: 'display', action: 'read:any', attributes: '*' },
            { resource: 'flash', action: 'read:any', attributes: '*' },
            { resource: 'info', action: 'read:any', attributes: '*' },
            { resource: 'logs', action: 'read:any', attributes: '*' },
            { resource: 'os', action: 'read:any', attributes: '*' },
            { resource: 'owner', action: 'read:any', attributes: '*' },
            { resource: 'permission', action: 'read:any', attributes: '*' },
            { resource: 'registration', action: 'read:any', attributes: '*' },
            { resource: 'servers', action: 'read:any', attributes: '*' },
            { resource: 'vars', action: 'read:any', attributes: '*' },
            { resource: 'config', action: 'update:own', attributes: '*' },
            { resource: 'connect', action: 'read:own', attributes: '*' },
            { resource: 'connect', action: 'update:own', attributes: '*' },
            { resource: 'notifications', action: 'read:any', attributes: '*' },
            { resource: 'notifications', action: 'update:any', attributes: '*' },
        ],
    },
    my_servers: {
        extends: 'guest',
        permissions: [
            { resource: 'array', action: 'read:any', attributes: '*' },
            { resource: 'config', action: 'read:any', attributes: '*' },
            { resource: 'connect', action: 'read:any', attributes: '*' },
            {
                resource: 'connect/dynamic-remote-access',
                action: 'read:any',
                attributes: '*',
            },
            {
                resource: 'connect/dynamic-remote-access',
                action: 'update:own',
                attributes: '*',
            },
            { resource: 'customizations', action: 'read:any', attributes: '*' },
            { resource: 'dashboard', action: 'read:any', attributes: '*' },
            { resource: 'display', action: 'read:any', attributes: '*' },
            {
                resource: 'docker/container',
                action: 'read:any',
                attributes: '*',
            },
            { resource: 'docker', action: 'read:any', attributes: '*' },
            {
                resource: 'docker/container',
                action: 'read:any',
                attributes: '*',
            },
            { resource: 'info', action: 'read:any', attributes: '*' },
            { resource: 'logs', action: 'read:any', attributes: '*' },
            { resource: 'network', action: 'read:any', attributes: '*' },
            { resource: 'notifications', action: 'read:any', attributes: '*' },
            { resource: 'services', action: 'read:any', attributes: '*' },
            { resource: 'vars', action: 'read:any', attributes: '*' },
            { resource: 'vms', action: 'read:any', attributes: '*' },
            { resource: 'vms/domain', action: 'read:any', attributes: '*' },
            { resource: 'unraid-version', action: 'read:any', attributes: '*' },
        ],
    },
    notifier: {
        extends: 'guest',
        permissions: [
            {
                resource: 'notifications',
                action: 'create:own',
                attributes: '*',
            },
        ],
    },
    guest: {
        permissions: [
            { resource: 'me', action: 'read:any', attributes: '*' },
            { resource: 'welcome', action: 'read:any', attributes: '*' },
        ],
    },
};

export const setupPermissions = (): RolesBuilder => {
    // First create an array of permissions that will be used as the base permission set for the app
    const grantList = Object.entries(roles).reduce<Array<Permission>>(
        (acc, [roleName, role]) => {
            if (role.permissions) {
                role.permissions.forEach((permission) => {
                    acc.push({
                        ...permission,
                        role: roleName,
                    });
                });
            }
            return acc;
        },
        []
    );

    const ac = new RolesBuilder(grantList);

    // Next, Extend roles
    Object.entries(roles).forEach(([roleName, role]) => {
        if (role.extends) {
            ac.extendRole(roleName, role.extends);
        }
    });

    apiLogger.debug('Possible Roles: %o', ac.getRoles());

    return ac;
};

export const ac = null;
