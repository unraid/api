import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { mergeSettingSlices } from '@unraid/shared/jsonforms/settings.js';
import { ConfigFilePersister } from '@unraid/shared/services/config-file.js';
import { UserSettingsService } from '@unraid/shared/services/user-settings.js';

import { OidcProvider } from '@app/unraid-api/graph/resolvers/sso/oidc-provider.model.js';
import { createLabeledControl } from '@app/unraid-api/graph/utils/form-utils.js';
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
            authorizedSubIds: [],
            buttonText: 'Login With Unraid.net',
            buttonIcon: undefined,
        };
    }

    async migrateConfig(): Promise<OidcConfig> {
        // Get existing SSO users from the main config
        const ssoSubIds = this.configService.get<string[]>('api.ssoSubIds', []);

        // Always ensure Unraid.net SSO provider is present with migrated users
        const unraidNetSsoProvider = this.getUnraidNetSsoProvider();
        unraidNetSsoProvider.authorizedSubIds = ssoSubIds;

        // No existing providers, return default with migrated SSO users
        if (ssoSubIds.length > 0) {
            this.logger.log(`Migrated ${ssoSubIds.length} SSO users to Unraid.net provider`);
        }

        return {
            providers: [unraidNetSsoProvider],
        };
    }

    async getProviders(): Promise<OidcProvider[]> {
        const config = this.configService.get<OidcConfig>(this.configKey());
        return config?.providers || [];
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

    private getConfig(): OidcConfig {
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
                                type: 'string',
                                title: 'Authorization Endpoint',
                                format: 'uri',
                                description: 'Optional - will be auto-discovered if not provided',
                            },
                            tokenEndpoint: {
                                type: 'string',
                                title: 'Token Endpoint',
                                format: 'uri',
                                description: 'Optional - will be auto-discovered if not provided',
                            },
                            jwksUri: {
                                type: 'string',
                                title: 'JWKS URI',
                                format: 'uri',
                                description: 'Optional - will be auto-discovered if not provided',
                            },
                            scopes: {
                                type: 'array',
                                items: { type: 'string' },
                                title: 'Scopes',
                                default: ['openid', 'profile', 'email'],
                                description: 'OAuth2 scopes to request',
                            },
                            authorizedSubIds: {
                                type: 'array',
                                items: { type: 'string' },
                                title: 'Authorized Users',
                                description: 'Subject IDs allowed to authenticate with this provider',
                            },
                            buttonText: {
                                type: 'string',
                                title: 'Button Text',
                                description: 'Custom text for the login button',
                            },
                            buttonIcon: {
                                type: 'string',
                                title: 'Button Icon URL',
                                format: 'uri',
                                description: 'URL or base64 encoded icon for the login button',
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
                    type: 'Control',
                    scope: '#/properties/sso/properties/providers',
                    label: 'OIDC Providers',
                    options: {
                        elementLabelProp: 'name',
                        detail: {
                            type: 'VerticalLayout',
                            elements: [
                                createLabeledControl({
                                    scope: '#/properties/id',
                                    label: 'Provider ID:',
                                    description: 'Unique identifier (e.g., google, github)',
                                    controlOptions: {
                                        inputType: 'text',
                                        placeholder: 'provider-id',
                                    },
                                }),
                                createLabeledControl({
                                    scope: '#/properties/name',
                                    label: 'Provider Name:',
                                    description: 'Display name for users',
                                    controlOptions: {
                                        inputType: 'text',
                                        placeholder: 'My Provider',
                                    },
                                }),
                                createLabeledControl({
                                    scope: '#/properties/clientId',
                                    label: 'Client ID:',
                                    description: 'OAuth2 application client ID',
                                    controlOptions: {
                                        inputType: 'text',
                                    },
                                }),
                                createLabeledControl({
                                    scope: '#/properties/clientSecret',
                                    label: 'Client Secret:',
                                    description: 'OAuth2 application client secret (optional)',
                                    controlOptions: {
                                        inputType: 'password',
                                    },
                                }),
                                createLabeledControl({
                                    scope: '#/properties/issuer',
                                    label: 'Issuer URL:',
                                    description: 'OIDC issuer/discovery URL',
                                    controlOptions: {
                                        inputType: 'url',
                                        placeholder: 'https://accounts.google.com',
                                    },
                                }),
                                createLabeledControl({
                                    scope: '#/properties/authorizationEndpoint',
                                    label: 'Authorization Endpoint:',
                                    description: 'Override auto-discovery (optional)',
                                    controlOptions: {
                                        inputType: 'url',
                                    },
                                }),
                                createLabeledControl({
                                    scope: '#/properties/tokenEndpoint',
                                    label: 'Token Endpoint:',
                                    description: 'Override auto-discovery (optional)',
                                    controlOptions: {
                                        inputType: 'url',
                                    },
                                }),
                                createLabeledControl({
                                    scope: '#/properties/jwksUri',
                                    label: 'JWKS URI:',
                                    description: 'Override auto-discovery (optional)',
                                    controlOptions: {
                                        inputType: 'url',
                                    },
                                }),
                                createLabeledControl({
                                    scope: '#/properties/scopes',
                                    label: 'OAuth Scopes:',
                                    description: 'Scopes to request from the provider',
                                    controlOptions: {
                                        format: 'array',
                                        inputType: 'text',
                                        placeholder: 'openid',
                                    },
                                }),
                                createLabeledControl({
                                    scope: '#/properties/authorizedSubIds',
                                    label: 'Authorized User IDs:',
                                    description: 'Subject IDs allowed to use this provider',
                                    controlOptions: {
                                        format: 'array',
                                        inputType: 'text',
                                        placeholder: 'user-sub-id',
                                    },
                                }),
                                createLabeledControl({
                                    scope: '#/properties/buttonText',
                                    label: 'Button Text:',
                                    description: 'Custom login button text (optional)',
                                    controlOptions: {
                                        inputType: 'text',
                                        placeholder: 'Sign in with Provider',
                                    },
                                }),
                                createLabeledControl({
                                    scope: '#/properties/buttonIcon',
                                    label: 'Button Icon URL:',
                                    description: 'Icon URL or base64 data URI (optional)',
                                    controlOptions: {
                                        inputType: 'url',
                                    },
                                }),
                            ],
                        },
                    },
                },
            ],
        };
    }
}
