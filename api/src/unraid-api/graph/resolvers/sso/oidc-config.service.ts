import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { mergeSettingSlices } from '@unraid/shared/jsonforms/settings.js';
import { ConfigFilePersister } from '@unraid/shared/services/config-file.js';
import { UserSettingsService } from '@unraid/shared/services/user-settings.js';

import {
    AuthorizationOperator,
    OidcProvider,
} from '@app/unraid-api/graph/resolvers/sso/oidc-provider.model.js';
import {
    createLabeledControl,
    createSimpleLabeledControl,
} from '@app/unraid-api/graph/utils/form-utils.js';
import { SettingSlice } from '@app/unraid-api/types/json-forms.js';

export interface OidcConfig {
    providers: OidcProvider[];
}

@Injectable()
export class OidcConfigPersistence extends ConfigFilePersister<OidcConfig> {
    constructor(
        configService: ConfigService,
        private readonly userSettings: UserSettingsService
    ) {
        super(configService);
        this.registerSettings();
    }

    fileName(): string {
        // Check for environment variable override
        const envPath = process.env.PATHS_OIDC_JSON;
        if (envPath) {
            // Extract just the filename from the path
            const parts = envPath.split('/');
            return parts[parts.length - 1];
        }
        return 'oidc.json';
    }

    configKey(): string {
        return 'oidc';
    }

    defaultConfig(): OidcConfig {
        return {
            providers: [this.getUnraidNetSsoProvider()],
        };
    }

    private getUnraidNetSsoProvider(): OidcProvider {
        return {
            id: 'unraid.net',
            name: 'Unraid.net',
            clientId: 'CONNECT_SERVER_SSO',
            issuer: 'https://account.unraid.net',
            scopes: ['openid', 'profile', 'email'],
            authorizationRules: [],
            buttonText: 'Login With Unraid.net',
            buttonIcon: undefined,
            buttonVariant: 'primary',
            buttonStyle: undefined,
        };
    }

    async migrateConfig(): Promise<OidcConfig> {
        // Get existing SSO users from the main config
        const ssoSubIds = this.configService.get<string[]>('api.ssoSubIds', []);

        // Always ensure Unraid.net SSO provider is present with migrated users
        const unraidNetSsoProvider = this.getUnraidNetSsoProvider();

        // Convert legacy authorizedSubIds to authorization rules
        if (ssoSubIds.length > 0) {
            unraidNetSsoProvider.authorizationRules = [
                {
                    claim: 'sub',
                    operator: AuthorizationOperator.EQUALS,
                    value: ssoSubIds,
                },
            ];
            this.logger.log(`Migrated ${ssoSubIds.length} SSO users to authorization rules`);
        }

        return {
            providers: [unraidNetSsoProvider],
        };
    }

    async getProviders(): Promise<OidcProvider[]> {
        const config = this.configService.get<OidcConfig>(this.configKey());
        const providers = config?.providers || [];

        // Clean up providers - convert empty strings to undefined
        return providers.map((provider) => this.cleanProvider(provider));
    }

    private cleanProvider(provider: OidcProvider): OidcProvider {
        // Convert empty strings to undefined for optional fields
        return {
            ...provider,
            clientSecret: provider.clientSecret?.trim() || undefined,
            authorizationEndpoint: provider.authorizationEndpoint?.trim() || undefined,
            tokenEndpoint: provider.tokenEndpoint?.trim() || undefined,
            buttonIcon: provider.buttonIcon?.trim() || undefined,
            buttonStyle: provider.buttonStyle?.trim() || undefined,
        };
    }

    async getProvider(id: string): Promise<OidcProvider | null> {
        const providers = await this.getProviders();
        return providers.find((p) => p.id === id) || null;
    }

    async upsertProvider(provider: OidcProvider): Promise<OidcProvider> {
        const config = this.configService.get<OidcConfig>(this.configKey()) || this.defaultConfig();
        const providers = [...config.providers];
        const existingIndex = providers.findIndex((p) => p.id === provider.id);

        if (existingIndex >= 0) {
            providers[existingIndex] = provider;
        } else {
            providers.push(provider);
        }

        const newConfig = { ...config, providers };
        this.configService.set(this.configKey(), newConfig);
        await this.persist(newConfig);

        return provider;
    }

    async deleteProvider(id: string): Promise<boolean> {
        const config = this.configService.get<OidcConfig>(this.configKey()) || this.defaultConfig();
        const filteredProviders = config.providers.filter((p) => p.id !== id);

        if (filteredProviders.length === config.providers.length) {
            return false;
        }

        const newConfig = { ...config, providers: filteredProviders };
        this.configService.set(this.configKey(), newConfig);
        await this.persist(newConfig);

        return true;
    }

    private registerSettings() {
        this.userSettings.register('sso', {
            buildSlice: async () => this.buildSlice(),
            getCurrentValues: async () => this.getConfig(),
            updateValues: async (config: OidcConfig) => {
                this.configService.set(this.configKey(), config);
                await this.persist(config);
                return { restartRequired: true, values: config };
            },
        });
    }

    getConfig(): OidcConfig {
        return this.configService.get<OidcConfig>(this.configKey()) || this.defaultConfig();
    }

    private buildSlice(): SettingSlice {
        return mergeSettingSlices([this.oidcProvidersSlice()], { as: 'sso' });
    }

    private oidcProvidersSlice(): SettingSlice {
        return {
            properties: {
                providers: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id: {
                                type: 'string',
                                title: 'Provider ID',
                                description: 'Unique identifier for the provider',
                                pattern: '^[a-zA-Z0-9._-]+$',
                            },
                            name: {
                                type: 'string',
                                title: 'Provider Name',
                                description: 'Display name for the provider',
                            },
                            clientId: {
                                type: 'string',
                                title: 'Client ID',
                                description: 'OAuth2 client ID registered with the provider',
                            },
                            clientSecret: {
                                type: 'string',
                                title: 'Client Secret',
                                description: 'OAuth2 client secret (if required)',
                            },
                            issuer: {
                                type: 'string',
                                title: 'Issuer URL',
                                format: 'uri',
                                description: 'OIDC issuer URL (e.g., https://accounts.google.com)',
                            },
                            authorizationEndpoint: {
                                anyOf: [
                                    { type: 'string', minLength: 1, format: 'uri' },
                                    { type: 'string', maxLength: 0 },
                                ],
                                title: 'Authorization Endpoint',
                                description: 'Optional - will be auto-discovered if not provided',
                            },
                            tokenEndpoint: {
                                anyOf: [
                                    { type: 'string', minLength: 1, format: 'uri' },
                                    { type: 'string', maxLength: 0 },
                                ],
                                title: 'Token Endpoint',
                                description: 'Optional - will be auto-discovered if not provided',
                            },
                            jwksUri: {
                                anyOf: [
                                    { type: 'string', minLength: 1, format: 'uri' },
                                    { type: 'string', maxLength: 0 },
                                ],
                                title: 'JWKS URI',
                                description: 'Optional - will be auto-discovered if not provided',
                            },
                            scopes: {
                                type: 'array',
                                items: { type: 'string' },
                                title: 'Scopes',
                                default: ['openid', 'profile', 'email'],
                                description: 'OAuth2 scopes to request',
                            },
                            authorizationRules: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        claim: {
                                            type: 'string',
                                            title: 'Claim',
                                            description: 'JWT claim to check',
                                        },
                                        operator: {
                                            type: 'string',
                                            title: 'Operator',
                                            enum: ['equals', 'contains', 'endsWith', 'startsWith'],
                                        },
                                        value: {
                                            type: 'array',
                                            items: { type: 'string' },
                                            title: 'Values',
                                            description: 'Values to match against',
                                        },
                                    },
                                    required: ['claim', 'operator', 'value'],
                                },
                                title: 'Claim Rules',
                                description:
                                    'Define authorization rules based on claims in the ID token. Multiple rules use OR logic - if any rule matches, the user is authorized.',
                            },
                            buttonText: {
                                type: 'string',
                                title: 'Button Text',
                                description: 'Custom text for the login button',
                            },
                            buttonIcon: {
                                anyOf: [
                                    { type: 'string', minLength: 1 },
                                    { type: 'string', maxLength: 0 },
                                ],
                                title: 'Button Icon URL',
                                description: 'URL or base64 encoded icon for the login button',
                            },
                            buttonVariant: {
                                type: 'string',
                                title: 'Button Style',
                                enum: [
                                    'primary',
                                    'destructive',
                                    'outline',
                                    'secondary',
                                    'ghost',
                                    'link',
                                ],
                                description: 'Visual style of the login button',
                                default: 'outline',
                            },
                            buttonStyle: {
                                type: 'string',
                                title: 'Custom CSS Styles',
                                description:
                                    'Custom inline CSS styles for the button (e.g., "background: linear-gradient(to right, #4f46e5, #7c3aed); border-radius: 9999px;")',
                            },
                        },
                        required: ['id', 'name', 'clientId', 'issuer'],
                    },
                    title: 'OIDC Providers',
                    description: 'Configure OpenID Connect providers for SSO authentication',
                },
            },
            elements: [
                {
                    type: 'VerticalLayout',
                    elements: [
                        {
                            type: 'Label',
                            text: 'OIDC Providers',
                            options: {
                                format: 'title',
                            },
                        },
                        {
                            type: 'Control',
                            scope: '#/properties/sso/properties/providers',
                            options: {
                                elementLabelProp: 'name',
                                itemTypeName: 'Provider',
                                detail: {
                                    type: 'VerticalLayout',
                                    elements: [
                                        createSimpleLabeledControl({
                                            scope: '#/properties/id',
                                            label: 'Provider ID:',
                                            description: 'Unique identifier (e.g., google, github)',
                                            controlOptions: {
                                                inputType: 'text',
                                                placeholder: 'provider-id',
                                            },
                                        }),
                                        createSimpleLabeledControl({
                                            scope: '#/properties/name',
                                            label: 'Provider Name:',
                                            description: 'Display name for users',
                                            controlOptions: {
                                                inputType: 'text',
                                                placeholder: 'My Provider',
                                            },
                                        }),
                                        createSimpleLabeledControl({
                                            scope: '#/properties/clientId',
                                            label: 'Client ID:',
                                            description: 'OAuth2 application client ID',
                                            controlOptions: {
                                                inputType: 'text',
                                            },
                                        }),
                                        createSimpleLabeledControl({
                                            scope: '#/properties/clientSecret',
                                            label: 'Client Secret:',
                                            description: 'OAuth2 application client secret (optional)',
                                            controlOptions: {
                                                inputType: 'password',
                                            },
                                        }),
                                        createSimpleLabeledControl({
                                            scope: '#/properties/issuer',
                                            label: 'Issuer URL:',
                                            description: 'OIDC issuer/discovery URL',
                                            controlOptions: {
                                                inputType: 'url',
                                                placeholder: 'https://accounts.google.com',
                                            },
                                        }),
                                        createSimpleLabeledControl({
                                            scope: '#/properties/authorizationEndpoint',
                                            label: 'Authorization Endpoint:',
                                            description: 'Override auto-discovery (optional)',
                                            controlOptions: {
                                                inputType: 'url',
                                            },
                                        }),
                                        createSimpleLabeledControl({
                                            scope: '#/properties/tokenEndpoint',
                                            label: 'Token Endpoint:',
                                            description: 'Override auto-discovery (optional)',
                                            controlOptions: {
                                                inputType: 'url',
                                            },
                                        }),
                                        createSimpleLabeledControl({
                                            scope: '#/properties/jwksUri',
                                            label: 'JWKS URI:',
                                            description: 'Override auto-discovery (optional)',
                                            controlOptions: {
                                                inputType: 'url',
                                            },
                                        }),
                                        createSimpleLabeledControl({
                                            scope: '#/properties/scopes',
                                            label: 'OAuth Scopes:',
                                            description: 'Scopes to request from the provider',
                                            controlOptions: {
                                                format: 'array',
                                                inputType: 'text',
                                                placeholder: 'openid',
                                            },
                                        }),
                                        {
                                            type: 'Label',
                                            text: 'Authorization Rules',
                                            options: {
                                                description:
                                                    'Define authorization rules based on claims in the ID token. Multiple rules use OR logic - if any rule matches, the user is authorized.',
                                            },
                                        },
                                        {
                                            type: 'Control',
                                            scope: '#/properties/authorizationRules',
                                            options: {
                                                elementLabelFormat: '${claim} ${operator}',
                                                itemTypeName: 'Rule',
                                                detail: {
                                                    type: 'VerticalLayout',
                                                    elements: [
                                                        createSimpleLabeledControl({
                                                            scope: '#/properties/claim',
                                                            label: 'JWT Claim:',
                                                            description:
                                                                'JWT claim to check (e.g., email, sub, groups, hd for Google hosted domain)',
                                                            controlOptions: {
                                                                inputType: 'text',
                                                                placeholder: 'email',
                                                            },
                                                        }),
                                                        createSimpleLabeledControl({
                                                            scope: '#/properties/operator',
                                                            label: 'Operator:',
                                                            description:
                                                                'How to compare the claim value',
                                                            controlOptions: {},
                                                        }),
                                                        createSimpleLabeledControl({
                                                            scope: '#/properties/value',
                                                            label: 'Values:',
                                                            description:
                                                                'Value(s) to match against (any match passes)',
                                                            controlOptions: {
                                                                format: 'array',
                                                                inputType: 'text',
                                                                placeholder: '@company.com',
                                                            },
                                                        }),
                                                    ],
                                                },
                                            },
                                        },
                                        createSimpleLabeledControl({
                                            scope: '#/properties/buttonText',
                                            label: 'Button Text:',
                                            description: 'Custom login button text (optional)',
                                            controlOptions: {
                                                inputType: 'text',
                                                placeholder: 'Sign in with Provider',
                                            },
                                        }),
                                        createSimpleLabeledControl({
                                            scope: '#/properties/buttonIcon',
                                            label: 'Button Icon URL:',
                                            description: 'Icon URL or base64 data URI (optional)',
                                            controlOptions: {
                                                inputType: 'url',
                                            },
                                        }),
                                        createSimpleLabeledControl({
                                            scope: '#/properties/buttonVariant',
                                            label: 'Button Style:',
                                            description: 'Visual style of the login button',
                                            controlOptions: {},
                                        }),
                                        createSimpleLabeledControl({
                                            scope: '#/properties/buttonStyle',
                                            label: 'Custom CSS Styles:',
                                            description:
                                                'Inline CSS styles for custom button appearance. Examples: "background: linear-gradient(45deg, #667eea, #764ba2); box-shadow: 0 4px 6px rgba(0,0,0,0.1);" for gradient with shadow',
                                            controlOptions: {
                                                inputType: 'text',
                                                placeholder:
                                                    'border-radius: 9999px; text-transform: none;',
                                            },
                                        }),
                                    ],
                                },
                            },
                        },
                    ],
                },
            ],
        };
    }
}
