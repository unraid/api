import { Args, Query, ResolveField, Resolver } from '@nestjs/graphql';

import { AuthActionVerb, AuthPossession, UsePermissions } from 'nest-authz';

import { Resource } from '@app/graphql/generated/api/types.js';
import { ConnectSettingsService } from '@app/unraid-api/graph/resolvers/settings/connect-settings.service.js';

@Resolver('ConnectSettings')
export class ConnectSettingsResolver {
    constructor(private readonly connectSettingsService: ConnectSettingsService) {}

    @Query()
    @UsePermissions({
        action: AuthActionVerb.READ,
        resource: Resource.CONNECT,
        possession: AuthPossession.ANY,
    })
    public async connectSettingsForm() {
        return {
            id: 'connectSettingsForm',
        };
    }

    @ResolveField()
    public async dataSchema() {
        return {
            type: 'object',
            properties: {
                remoteAccess: await this.connectSettingsService.remoteAccessDataSchema(),
                wanPort: {
                    type: 'number',
                    title: 'WAN Port',
                    minimum: 0,
                    maximum: 65535,
                },
                sandbox: {
                    type: 'boolean',
                    label: 'Enable Developer Sandbox',
                    // title: 'Enable Developer Sandbox',
                    default: false,
                },
                flashBackup: {
                    type: 'object',
                    properties: {
                        status: {
                            type: 'string',
                            enum: ['inactive', 'active', 'updating'],
                            default: 'inactive',
                        },
                    },
                },
                extraOrigins: {
                    type: 'array',
                    items: {
                        type: 'string',
                        format: 'url',
                    },
                    title: 'Unraid API extra origins',
                    description: `Provide a comma separated list of urls that are allowed to access the unraid-api. \ne.g. https://abc.myreverseproxy.com`,
                },
            },
        };
    }

    @ResolveField()
    public async uiSchema() {
        return {
            type: 'VerticalLayout',
            elements: [
                await this.connectSettingsService.remoteAccessUiSchema(),
                {
                    type: 'Control',
                    scope: '#/properties/wanPort',
                    label: 'WAN Port',
                    options: {
                        format: 'short',
                    },
                    rule: {
                        effect: 'SHOW',
                        condition: {
                            scope: '#/properties/remoteAccess',
                            schema: {
                                enum: ['DYNAMIC_MANUAL', 'ALWAYS_MANUAL'],
                            },
                        },
                    },
                },
                {
                    type: 'Control',
                    scope: '#/properties/sandbox',
                    label: 'Enable Developer Sandbox:',
                    options: {
                        toggle: true,
                    },
                },
                {
                    type: 'Control',
                    scope: '#/properties/extraOrigins',
                    options: {
                        inputType: 'url',
                        placeholder: 'https://example.com',
                    },
                },
            ],
        };
    }
}
