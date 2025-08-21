import { Injectable } from '@nestjs/common';

import type { JsonSchema, LabelElement, UISchemaElement } from '@jsonforms/core';
import { Resource, Role } from '@unraid/shared/graphql.model.js';
import { mergeSettingSlices } from '@unraid/shared/jsonforms/settings.js';
import { capitalCase } from 'change-case';
import { AuthAction } from 'nest-authz';

import type { SettingSlice } from '@app/unraid-api/types/json-forms.js';
import {
    createLabeledControl,
    createSimpleLabeledControl,
} from '@app/unraid-api/graph/utils/form-utils.js';

export interface ApiKeyFormData {
    name: string;
    description?: string;
    authorizationType?: 'roles' | 'groups' | 'custom';
    roles?: Role[];
    permissionGroups?: string[];
    customPermissions?: Array<{
        resources: Resource[]; // Form uses array for multi-select
        actions: string[];
    }>;
    expiresAt?: string;
}

@Injectable()
export class ApiKeyFormService {
    /**
     * Generate form schema for API key creation
     */
    getApiKeyCreationFormSchema(): {
        id: string;
        dataSchema: Record<string, any>;
        uiSchema: Record<string, any>;
        values: Record<string, any>;
    } {
        const slice = this.createApiKeyCreationSlice();
        const merged = mergeSettingSlices([slice]);

        return {
            id: 'api-key-creation-form',
            dataSchema: {
                type: 'object',
                required: ['name'],
                properties: merged.properties,
            },
            uiSchema: {
                type: 'VerticalLayout',
                elements: merged.elements,
            },
            values: {},
        };
    }

    private createApiKeyCreationSlice(): SettingSlice {
        const slice: SettingSlice = {
            properties: {
                name: {
                    type: 'string',
                    title: 'API Key Name',
                    description: 'A descriptive name for this API key',
                    minLength: 3,
                    maxLength: 100,
                },
                description: {
                    type: 'string',
                    title: 'Description',
                    description: 'Optional description of what this key is used for',
                    maxLength: 500,
                },
                roles: {
                    type: 'array',
                    title: 'Roles',
                    description: 'Select one or more roles to grant pre-defined permission sets',
                    items: {
                        type: 'string',
                        enum: this.getAvailableRoles(),
                    },
                    uniqueItems: true,
                },
                permissionPresets: {
                    type: 'string',
                    title: 'Add Permission Preset',
                    description: 'Quick add common permission sets',
                    enum: [
                        'none',
                        'docker_manager',
                        'vm_manager',
                        'monitoring',
                        'backup_manager',
                        'network_admin',
                    ],
                    default: 'none',
                },
                customPermissions: {
                    type: 'array',
                    title: 'Permissions',
                    description: 'Configure specific permissions',
                    items: {
                        type: 'object',
                        properties: {
                            resources: {
                                type: 'array',
                                title: 'Resources',
                                items: {
                                    type: 'string',
                                    enum: this.getAvailableResources(),
                                },
                                uniqueItems: true,
                                minItems: 1,
                                default: [this.getAvailableResources()[0]], // Set a default value as array
                            },
                            actions: {
                                type: 'array',
                                title: 'Actions',
                                items: {
                                    type: 'string',
                                    enum: [
                                        AuthAction.CREATE_ANY,
                                        AuthAction.READ_ANY,
                                        AuthAction.UPDATE_ANY,
                                        AuthAction.DELETE_ANY,
                                    ],
                                },
                                uniqueItems: true,
                                minItems: 1,
                                default: [AuthAction.READ_ANY], // Set a default action
                            },
                        },
                        required: ['resources', 'actions'],
                    },
                },
                // Commenting out expiration date until date picker is implemented
                // expiresAt: {
                //   type: 'string',
                //   format: 'date-time',
                //   title: 'Expiration Date',
                //   description: 'Optional expiration date for this API key',
                // },
            },
            elements: [
                createLabeledControl({
                    scope: '#/properties/name',
                    label: 'API Key Name',
                    description: 'A descriptive name for this API key',
                    layoutType: 'VerticalLayout',
                    controlOptions: {
                        inputType: 'text',
                    },
                }),
                createLabeledControl({
                    scope: '#/properties/description',
                    label: 'Description',
                    description: 'Optional description of what this key is used for',
                    layoutType: 'VerticalLayout',
                    controlOptions: {
                        multi: true,
                        rows: 3,
                    },
                }),
                // Permissions section header
                {
                    type: 'Label',
                    text: 'Permissions Configuration',
                    options: {
                        format: 'title',
                    },
                } as LabelElement,
                {
                    type: 'Label',
                    text: 'Select any combination of roles, permission groups, and custom permissions to define what this API key can access.',
                    options: {
                        format: 'description',
                    },
                } as LabelElement,
                // Roles selection
                createLabeledControl({
                    scope: '#/properties/roles',
                    label: 'Roles',
                    description: 'Select one or more roles to grant pre-defined permission sets',
                    layoutType: 'VerticalLayout',
                    controlOptions: {
                        multiple: true,
                        labels: this.getAvailableRoles().reduce(
                            (acc, role) => ({
                                ...acc,
                                [role]: capitalCase(role),
                            }),
                            {}
                        ),
                        descriptions: this.getRoleDescriptions(),
                    },
                }),
                // Separator for permissions
                {
                    type: 'Label',
                    text: 'Permissions',
                    options: {
                        format: 'subtitle',
                    },
                } as LabelElement,
                {
                    type: 'Label',
                    text: 'Use the preset dropdown for common permission sets, or manually add custom permissions. You can select multiple resources that share the same actions.',
                    options: {
                        format: 'description',
                    },
                } as LabelElement,
                // Permission preset dropdown
                createLabeledControl({
                    scope: '#/properties/permissionPresets',
                    label: 'Quick Add Presets',
                    description: 'Select a preset to quickly add common permission sets',
                    layoutType: 'VerticalLayout',
                    controlOptions: {
                        labels: {
                            none: '-- Select a preset --',
                            docker_manager: 'Docker Manager (Full Docker Control)',
                            vm_manager: 'VM Manager (Full VM Control)',
                            monitoring: 'Monitoring (Read-only System Info)',
                            backup_manager: 'Backup Manager (Flash & Share Control)',
                            network_admin: 'Network Admin (Network & Services Control)',
                        },
                    },
                }),
                // Custom permissions array - following OIDC pattern exactly
                {
                    type: 'Control',
                    scope: '#/properties/customPermissions',
                    options: {
                        elementLabelFormat: 'Permission Entry',
                        itemTypeName: 'Permission',
                        detail: {
                            type: 'VerticalLayout',
                            elements: [
                                createSimpleLabeledControl({
                                    scope: '#/properties/resources',
                                    label: 'Resources:',
                                    description: 'Select the resources to grant permissions for',
                                    controlOptions: {
                                        multiple: true,
                                        labels: this.getAvailableResources().reduce(
                                            (acc, resource) => ({
                                                ...acc,
                                                [resource]: capitalCase(
                                                    resource.toLowerCase().replace(/_/g, ' ')
                                                ),
                                            }),
                                            {}
                                        ),
                                    },
                                }),
                                createSimpleLabeledControl({
                                    scope: '#/properties/actions',
                                    label: 'Actions:',
                                    description: 'Select the actions allowed on this resource',
                                    controlOptions: {
                                        multiple: true,
                                        labels: {
                                            [AuthAction.CREATE_ANY]: 'Create',
                                            [AuthAction.READ_ANY]: 'Read',
                                            [AuthAction.UPDATE_ANY]: 'Update',
                                            [AuthAction.DELETE_ANY]: 'Delete',
                                        },
                                    },
                                }),
                            ],
                        },
                    },
                } as UISchemaElement,
                // Note: Datetime inputs are not currently supported in the renderer
                // Would need to implement a date picker component
                // For now, commenting out the expiration date field
                // createLabeledControl({
                //   scope: '#/properties/expiresAt',
                //   label: 'Expiration Date:',
                //   description: 'Optional expiration date for this API key',
                //   controlOptions: {
                //     inputType: 'datetime-local',
                //   },
                // }),
            ],
        };

        return slice;
    }

    private getAvailableRoles(): Role[] {
        return [Role.ADMIN, Role.VIEWER, Role.CONNECT, Role.GUEST];
    }

    private getRoleDescriptions(): Record<Role, string> {
        return {
            [Role.ADMIN]: 'Full administrative access to all resources',
            [Role.VIEWER]: 'Read-only access to all resources',
            [Role.CONNECT]: 'Internal Role for Unraid Connect',
            [Role.GUEST]: 'Basic read access to user profile only',
        };
    }

    private getPermissionGroupIds(): string[] {
        return ['docker_manager', 'vm_manager', 'backup_manager', 'network_admin', 'monitoring'];
    }

    private getAvailableResources(): Resource[] {
        return Object.values(Resource);
    }

    getPermissionPreset(presetId: string): { resources: Resource[]; actions: string[] } | null {
        const presets: Record<string, { resources: Resource[]; actions: string[] }> = {
            docker_manager: {
                resources: [Resource.DOCKER],
                actions: [
                    AuthAction.CREATE_ANY,
                    AuthAction.READ_ANY,
                    AuthAction.UPDATE_ANY,
                    AuthAction.DELETE_ANY,
                ],
            },
            vm_manager: {
                resources: [Resource.VMS],
                actions: [
                    AuthAction.CREATE_ANY,
                    AuthAction.READ_ANY,
                    AuthAction.UPDATE_ANY,
                    AuthAction.DELETE_ANY,
                ],
            },
            monitoring: {
                resources: [
                    Resource.INFO,
                    Resource.DASHBOARD,
                    Resource.LOGS,
                    Resource.ARRAY,
                    Resource.DISK,
                    Resource.NETWORK,
                ],
                actions: [AuthAction.READ_ANY],
            },
            backup_manager: {
                resources: [Resource.FLASH, Resource.SHARE],
                actions: [
                    AuthAction.CREATE_ANY,
                    AuthAction.READ_ANY,
                    AuthAction.UPDATE_ANY,
                    AuthAction.DELETE_ANY,
                ],
            },
            network_admin: {
                resources: [Resource.NETWORK, Resource.SERVICES],
                actions: [
                    AuthAction.CREATE_ANY,
                    AuthAction.READ_ANY,
                    AuthAction.UPDATE_ANY,
                    AuthAction.DELETE_ANY,
                ],
            },
        };

        return presets[presetId] || null;
    }

    private parseScopesToPermissions(scopes: string[]): {
        roles: Role[];
        permissionGroups: string[];
        customPermissions: Array<{ resources: Resource[]; actions: string[] }>;
    } {
        const roles: Role[] = [];
        const permissionGroups: string[] = [];
        const resourcePermissions = new Map<Resource, Set<string>>();

        for (const scope of scopes) {
            if (scope.startsWith('role:')) {
                const role = scope.substring(5).toUpperCase() as Role;
                if (this.getAvailableRoles().includes(role)) {
                    roles.push(role);
                }
            } else if (scope.startsWith('group:')) {
                const group = scope.substring(6);
                if (this.getPermissionGroupIds().includes(group)) {
                    permissionGroups.push(group);
                }
            } else {
                // Parse resource:action format
                const [resourceStr, action] = scope.split(':');
                if (resourceStr && action) {
                    const resource = resourceStr.toUpperCase() as Resource;
                    if (Object.values(Resource).includes(resource)) {
                        if (!resourcePermissions.has(resource)) {
                            resourcePermissions.set(resource, new Set());
                        }
                        resourcePermissions.get(resource)!.add(action);
                    }
                }
            }
        }

        // Group resources by their action sets for better UI
        const actionGroups = new Map<string, Resource[]>();
        for (const [resource, actions] of resourcePermissions.entries()) {
            const actionKey = Array.from(actions).sort().join(',');
            if (!actionGroups.has(actionKey)) {
                actionGroups.set(actionKey, []);
            }
            actionGroups.get(actionKey)!.push(resource);
        }

        return {
            roles,
            permissionGroups,
            customPermissions: Array.from(actionGroups.entries()).map(([actionKey, resources]) => ({
                resources,
                actions: actionKey.split(','),
            })),
        };
    }

    /**
     * Convert form data back to permissions for API key creation
     */
    convertFormDataToPermissions(formData: ApiKeyFormData): {
        roles: Role[];
        permissions: Array<{ resource: Resource; actions: string[] }>;
    } {
        const roles: Role[] = [];
        const permissions = new Map<Resource, Set<string>>();

        // Handle based on authorization type
        if (formData.authorizationType === 'roles' && formData.roles) {
            roles.push(...formData.roles);
        } else if (formData.authorizationType === 'groups' && formData.permissionGroups) {
            // Convert permission groups to explicit permissions
            for (const groupId of formData.permissionGroups) {
                const groupPermissions = this.getPermissionsForGroup(groupId);
                for (const perm of groupPermissions) {
                    if (!permissions.has(perm.resource)) {
                        permissions.set(perm.resource, new Set());
                    }
                    perm.actions.forEach((action) => permissions.get(perm.resource)!.add(action));
                }
            }
        } else if (formData.authorizationType === 'custom' && formData.customPermissions) {
            // Expand resources array into individual permission entries
            for (const perm of formData.customPermissions) {
                for (const resource of perm.resources) {
                    if (!permissions.has(resource)) {
                        permissions.set(resource, new Set());
                    }
                    perm.actions.forEach((action) => permissions.get(resource)!.add(action));
                }
            }
        }

        return {
            roles,
            permissions: Array.from(permissions.entries()).map(([resource, actions]) => ({
                resource,
                actions: Array.from(actions),
            })),
        };
    }

    private getPermissionsForGroup(groupId: string): Array<{ resource: Resource; actions: string[] }> {
        // This would be moved to a central configuration
        const groups: Record<string, Array<{ resource: Resource; actions: string[] }>> = {
            docker_manager: [
                {
                    resource: Resource.DOCKER,
                    actions: [
                        AuthAction.CREATE_ANY,
                        AuthAction.READ_ANY,
                        AuthAction.UPDATE_ANY,
                        AuthAction.DELETE_ANY,
                    ],
                },
                { resource: Resource.ARRAY, actions: [AuthAction.READ_ANY] },
                { resource: Resource.DISK, actions: [AuthAction.READ_ANY] },
                { resource: Resource.NETWORK, actions: [AuthAction.READ_ANY] },
            ],
            vm_manager: [
                {
                    resource: Resource.VMS,
                    actions: [
                        AuthAction.CREATE_ANY,
                        AuthAction.READ_ANY,
                        AuthAction.UPDATE_ANY,
                        AuthAction.DELETE_ANY,
                    ],
                },
                { resource: Resource.ARRAY, actions: [AuthAction.READ_ANY] },
                { resource: Resource.DISK, actions: [AuthAction.READ_ANY] },
                { resource: Resource.NETWORK, actions: [AuthAction.READ_ANY] },
            ],
            backup_manager: [
                {
                    resource: Resource.FLASH,
                    actions: [
                        AuthAction.CREATE_ANY,
                        AuthAction.READ_ANY,
                        AuthAction.UPDATE_ANY,
                        AuthAction.DELETE_ANY,
                    ],
                },
                { resource: Resource.ARRAY, actions: [AuthAction.READ_ANY] },
                { resource: Resource.DISK, actions: [AuthAction.READ_ANY] },
                { resource: Resource.SHARE, actions: [AuthAction.READ_ANY] },
            ],
            network_admin: [
                {
                    resource: Resource.NETWORK,
                    actions: [
                        AuthAction.CREATE_ANY,
                        AuthAction.READ_ANY,
                        AuthAction.UPDATE_ANY,
                        AuthAction.DELETE_ANY,
                    ],
                },
                {
                    resource: Resource.SERVICES,
                    actions: [
                        AuthAction.CREATE_ANY,
                        AuthAction.READ_ANY,
                        AuthAction.UPDATE_ANY,
                        AuthAction.DELETE_ANY,
                    ],
                },
            ],
            monitoring: [
                { resource: Resource.DOCKER, actions: [AuthAction.READ_ANY] },
                { resource: Resource.VMS, actions: [AuthAction.READ_ANY] },
                { resource: Resource.ARRAY, actions: [AuthAction.READ_ANY] },
                { resource: Resource.DISK, actions: [AuthAction.READ_ANY] },
                { resource: Resource.NETWORK, actions: [AuthAction.READ_ANY] },
                { resource: Resource.INFO, actions: [AuthAction.READ_ANY] },
                { resource: Resource.DASHBOARD, actions: [AuthAction.READ_ANY] },
                { resource: Resource.LOGS, actions: [AuthAction.READ_ANY] },
            ],
        };

        return groups[groupId] || [];
    }
}
