import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { RuleEffect } from '@jsonforms/core';
import { mergeSettingSlices } from '@unraid/shared/jsonforms/settings.js';
import { ConfigFilePersister } from '@unraid/shared/services/config-file.js';
import { UserSettingsService } from '@unraid/shared/services/user-settings.js';

import {
    AuthorizationOperator,
    OidcAuthorizationRule,
    OidcProvider,
} from '@app/unraid-api/graph/resolvers/sso/oidc-provider.model.js';
import { OidcValidationService } from '@app/unraid-api/graph/resolvers/sso/oidc-validation.service.js';
import {
    createAccordionLayout,
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
        private readonly userSettings: UserSettingsService,
        private readonly validationService: OidcValidationService
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
            buttonIcon:
                'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMzMuNTIgNzYuOTciPjx0aXRsZT5VTi1tYXJrLXdoaXRlPC90aXRsZT48cGF0aCBkPSJNNjMuNDksMTkuMjRINzBWNTcuNzNINjMuNDlaTTYuNTQsNTcuNzNIMFYxOS4yNEg2LjU0Wm0yNS4yLDQuNTRoNi41NVY3N0gzMS43NFpNMTUuODcsNDUuODRoNi41NFY2OS42MkgxNS44N1ptMzEuNzUsMGg2LjU0VjY5LjYySDQ3LjYyWk0xMjcsMTkuMjRoNi41NFY1Ny43M0gxMjdaTTEwMS43NywxNC43SDk1LjIzVjBoNi41NFptMTUuODgsMTYuNDRIMTExLjFWNy4zNWg2LjU1Wm0tMzEuNzUsMEg3OS4zNlY3LjM1SDg1LjlaIiBmaWxsPSIjZmZmIi8+PC9zdmc+',
            buttonVariant: 'primary',
            buttonStyle: 'background-color: #ff6600; border-color: #ff6600; color: white;',
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

        // Ensure unraid.net provider is always present
        const hasUnraidNet = providers.some((p) => p.id === 'unraid.net');
        if (!hasUnraidNet) {
            providers.unshift(this.getUnraidNetSsoProvider());
        }

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

    async upsertProvider(
        provider: OidcProvider & { authorizationMode?: string; simpleAuthorization?: any }
    ): Promise<OidcProvider> {
        const config = this.configService.get<OidcConfig>(this.configKey()) || this.defaultConfig();
        const providers = [...config.providers];

        // If in simple mode, convert simple fields to authorization rules
        if (provider.authorizationMode === 'simple' && provider.simpleAuthorization) {
            const rules = this.convertSimpleToRules(provider.simpleAuthorization);
            provider.authorizationRules = rules;
        }

        // Clean up the provider object - remove UI-only fields
        const cleanedProvider: OidcProvider = {
            id: provider.id,
            name: provider.name,
            clientId: provider.clientId,
            clientSecret: provider.clientSecret,
            issuer: provider.issuer,
            authorizationEndpoint: provider.authorizationEndpoint,
            tokenEndpoint: provider.tokenEndpoint,
            jwksUri: provider.jwksUri,
            scopes: provider.scopes,
            authorizationRules: provider.authorizationRules,
            buttonText: provider.buttonText,
            buttonIcon: provider.buttonIcon,
            buttonVariant: provider.buttonVariant,
            buttonStyle: provider.buttonStyle,
            customAuthParams: provider.customAuthParams,
        };

        const existingIndex = providers.findIndex((p) => p.id === provider.id);
        if (existingIndex >= 0) {
            providers[existingIndex] = cleanedProvider;
        } else {
            providers.push(cleanedProvider);
        }

        const newConfig = { ...config, providers };
        this.configService.set(this.configKey(), newConfig);
        await this.persist(newConfig);

        return cleanedProvider;
    }

    private convertSimpleToRules(simpleAuth: {
        allowedDomains?: string[];
        allowedEmails?: string[];
        allowedUserIds?: string[];
        googleWorkspaceDomain?: string;
    }): OidcAuthorizationRule[] {
        const rules: OidcAuthorizationRule[] = [];

        // Convert email domains to endsWith rules
        if (simpleAuth?.allowedDomains && simpleAuth.allowedDomains.length > 0) {
            rules.push({
                claim: 'email',
                operator: AuthorizationOperator.ENDS_WITH,
                value: simpleAuth.allowedDomains.map((domain: string) =>
                    domain.startsWith('@') ? domain : `@${domain}`
                ),
            });
        }

        // Convert specific emails to equals rules
        if (simpleAuth?.allowedEmails && simpleAuth.allowedEmails.length > 0) {
            rules.push({
                claim: 'email',
                operator: AuthorizationOperator.EQUALS,
                value: simpleAuth.allowedEmails,
            });
        }

        // Convert user IDs to sub equals rules
        if (simpleAuth?.allowedUserIds && simpleAuth.allowedUserIds.length > 0) {
            rules.push({
                claim: 'sub',
                operator: AuthorizationOperator.EQUALS,
                value: simpleAuth.allowedUserIds,
            });
        }

        // Google Workspace domain (hd claim)
        if (simpleAuth?.googleWorkspaceDomain) {
            rules.push({
                claim: 'hd',
                operator: AuthorizationOperator.EQUALS,
                value: [simpleAuth.googleWorkspaceDomain],
            });
        }

        return rules;
    }

    async deleteProvider(id: string): Promise<boolean> {
        // Prevent deletion of the unraid.net provider
        if (id === 'unraid.net') {
            this.logger.warn(`Attempted to delete protected provider: ${id}`);
            return false;
        }

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
            updateValues: async (
                config: OidcConfig & {
                    providers: Array<
                        OidcProvider & { authorizationMode?: string; simpleAuthorization?: unknown }
                    >;
                }
            ) => {
                // Process each provider to handle simple mode conversion
                const processedConfig: OidcConfig = {
                    ...config,
                    providers: config.providers.map((provider) => {
                        const extendedProvider = provider as OidcProvider & {
                            authorizationMode?: string;
                            simpleAuthorization?: unknown;
                        };
                        // If in simple mode, convert simple fields to authorization rules
                        if (
                            extendedProvider.authorizationMode === 'simple' &&
                            extendedProvider.simpleAuthorization
                        ) {
                            const rules = this.convertSimpleToRules(
                                extendedProvider.simpleAuthorization as {
                                    allowedDomains?: string[];
                                    allowedEmails?: string[];
                                    allowedUserIds?: string[];
                                    googleWorkspaceDomain?: string;
                                }
                            );
                            // Return provider with generated rules, removing UI-only fields
                            const { authorizationMode, simpleAuthorization, ...cleanProvider } =
                                extendedProvider;
                            return {
                                ...cleanProvider,
                                authorizationRules: rules,
                            };
                        }
                        // If in advanced mode or no mode specified, just clean up UI fields
                        const { authorizationMode, simpleAuthorization, ...cleanProvider } =
                            extendedProvider;
                        return cleanProvider;
                    }),
                };

                // Validate OIDC discovery for all providers with issuer URLs
                const validationErrors: string[] = [];
                for (const provider of processedConfig.providers) {
                    if (provider.issuer) {
                        try {
                            // Parse the issuer URL and check if hostname is exactly 'unraid.net'
                            const issuerUrl = new URL(provider.issuer);
                            if (issuerUrl.hostname === 'unraid.net') {
                                // Skip validation for unraid.net as it uses custom auth flow
                                continue;
                            }
                        } catch (urlError) {
                            // Invalid URL, proceed with validation
                        }

                        try {
                            const validation = await this.validationService.validateProvider(provider);
                            if (!validation.isValid) {
                                validationErrors.push(`❌ ${provider.name}: ${validation.error}`);
                            }
                        } catch (error) {
                            // Don't fail the save, just warn
                            this.logger.warn(`Failed to validate provider ${provider.id}: ${error}`);
                        }
                    }
                }

                this.configService.set(this.configKey(), processedConfig);
                await this.persist(processedConfig);

                // Include validation results in response
                const response: { restartRequired: boolean; values: OidcConfig; warnings?: string[] } = {
                    restartRequired: true,
                    values: processedConfig,
                };

                if (validationErrors.length > 0) {
                    response.warnings = [
                        '⚠️  OIDC Discovery Issues Found:',
                        '',
                        ...validationErrors,
                        '',
                        '💡 These providers may not work properly. Please check your configuration.',
                        'Note: Configuration has been saved, but you should fix these issues before testing login.',
                    ];
                }

                return response;
            },
        });
    }

    getConfig(): OidcConfig & {
        providers: Array<
            OidcProvider & {
                authorizationMode?: string;
                simpleAuthorization?: unknown;
                isProtected?: boolean;
            }
        >;
    } {
        const config = this.configService.get<OidcConfig>(this.configKey()) || this.defaultConfig();

        // Ensure unraid.net provider always has current defaults while preserving authorization rules
        const providers = config.providers.map((provider) => {
            if (provider.id === 'unraid.net') {
                const currentDefaults = this.getUnraidNetSsoProvider();
                // Preserve existing authorization rules but override UI/button properties
                return {
                    ...provider,
                    ...currentDefaults,
                    // Keep existing authorization rules if they exist
                    authorizationRules:
                        provider.authorizationRules || currentDefaults.authorizationRules,
                };
            }
            return provider;
        });

        // Enhance providers with UI fields
        const enhancedProviders = providers.map((provider) => {
            const simpleAuth = this.convertRulesToSimple(provider.authorizationRules || []);

            // Determine if rules can be represented in simple mode
            const canUseSimpleMode = this.canConvertToSimpleMode(provider.authorizationRules || []);

            return {
                ...provider,
                authorizationMode: canUseSimpleMode ? 'simple' : 'advanced',
                simpleAuthorization: simpleAuth,
                isProtected: provider.id === 'unraid.net', // Mark unraid.net as protected
            };
        });

        return {
            ...config,
            providers: enhancedProviders,
        };
    }

    private canConvertToSimpleMode(rules: OidcAuthorizationRule[]): boolean {
        // Check if all rules match simple patterns
        return rules.every((rule) => {
            // Email domain rules
            if (rule.claim === 'email' && rule.operator === AuthorizationOperator.ENDS_WITH) {
                return rule.value.every((v) => v.startsWith('@'));
            }
            // Email equals rules
            if (rule.claim === 'email' && rule.operator === AuthorizationOperator.EQUALS) {
                return true;
            }
            // Sub equals rules
            if (rule.claim === 'sub' && rule.operator === AuthorizationOperator.EQUALS) {
                return true;
            }
            // Google Workspace domain
            if (rule.claim === 'hd' && rule.operator === AuthorizationOperator.EQUALS) {
                return true;
            }
            return false;
        });
    }

    private convertRulesToSimple(rules: OidcAuthorizationRule[]): {
        allowedDomains: string[];
        allowedEmails: string[];
        allowedUserIds: string[];
        googleWorkspaceDomain?: string;
    } {
        const simpleAuth = {
            allowedDomains: [] as string[],
            allowedEmails: [] as string[],
            allowedUserIds: [] as string[],
            googleWorkspaceDomain: undefined as string | undefined,
        };

        rules.forEach((rule) => {
            if (rule.claim === 'email' && rule.operator === AuthorizationOperator.ENDS_WITH) {
                simpleAuth.allowedDomains = rule.value.map((v) =>
                    v.startsWith('@') ? v.substring(1) : v
                );
            } else if (rule.claim === 'email' && rule.operator === AuthorizationOperator.EQUALS) {
                simpleAuth.allowedEmails = rule.value;
            } else if (rule.claim === 'sub' && rule.operator === AuthorizationOperator.EQUALS) {
                simpleAuth.allowedUserIds = rule.value;
            } else if (
                rule.claim === 'hd' &&
                rule.operator === AuthorizationOperator.EQUALS &&
                rule.value.length > 0
            ) {
                simpleAuth.googleWorkspaceDomain = rule.value[0];
            }
        });

        return simpleAuth;
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
                            authorizationMode: {
                                type: 'string',
                                title: 'Authorization Mode',
                                enum: ['simple', 'advanced'],
                                default: 'simple',
                                description:
                                    'Choose between simple presets or advanced rule configuration',
                            },
                            simpleAuthorization: {
                                type: 'object',
                                properties: {
                                    allowedDomains: {
                                        type: 'array',
                                        items: { type: 'string' },
                                        title: 'Allowed Email Domains',
                                        description:
                                            'Email domains that are allowed to login (e.g., company.com)',
                                    },
                                    allowedEmails: {
                                        type: 'array',
                                        items: { type: 'string' },
                                        title: 'Specific Email Addresses',
                                        description:
                                            'Specific email addresses that are allowed to login',
                                    },
                                    allowedUserIds: {
                                        type: 'array',
                                        items: { type: 'string' },
                                        title: 'Allowed User IDs',
                                        description:
                                            'Specific user IDs (sub claim) that are allowed to login',
                                    },
                                    googleWorkspaceDomain: {
                                        type: 'string',
                                        title: 'Google Workspace Domain',
                                        description:
                                            'Restrict to users from a specific Google Workspace domain',
                                    },
                                },
                            },
                            authorizationRuleMode: {
                                type: 'string',
                                title: 'Rule Mode',
                                enum: ['or', 'and'],
                                default: 'or',
                                description:
                                    'How to evaluate multiple rules: OR (any rule passes) or AND (all rules must pass)',
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
                                    'Define authorization rules based on claims in the ID token. Rule mode can be configured: OR logic (any rule matches) or AND logic (all rules must match).',
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
                                protectedItems: [{ field: 'id', value: 'unraid.net' }],
                                itemWarnings: [
                                    {
                                        condition: { field: 'id', value: 'unraid.net' },
                                        title: 'Unraid.net Provider',
                                        description:
                                            'This is the built-in Unraid.net provider. Only authorization rules can be modified.',
                                    },
                                ],
                                detail: createAccordionLayout({
                                    defaultOpen: [0],
                                    elements: [
                                        {
                                            type: 'VerticalLayout',
                                            options: {
                                                accordion: {
                                                    title: 'Basic Configuration',
                                                    description: 'Essential provider settings',
                                                },
                                            },
                                            rule: {
                                                effect: RuleEffect.HIDE,
                                                condition: {
                                                    scope: '#/properties/id',
                                                    schema: { const: 'unraid.net' },
                                                },
                                            },
                                            elements: [
                                                createSimpleLabeledControl({
                                                    scope: '#/properties/id',
                                                    label: 'Provider ID:',
                                                    description:
                                                        'Unique identifier (e.g., google, github)',
                                                    controlOptions: {
                                                        inputType: 'text',
                                                        placeholder: 'provider-id',
                                                    },
                                                    rule: {
                                                        effect: RuleEffect.HIDE,
                                                        condition: {
                                                            scope: '#/properties/id',
                                                            schema: { const: 'unraid.net' },
                                                        },
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
                                                    rule: {
                                                        effect: RuleEffect.HIDE,
                                                        condition: {
                                                            scope: '#/properties/id',
                                                            schema: { const: 'unraid.net' },
                                                        },
                                                    },
                                                }),
                                                createSimpleLabeledControl({
                                                    scope: '#/properties/clientId',
                                                    label: 'Client ID:',
                                                    description: 'OAuth2 application client ID',
                                                    controlOptions: {
                                                        inputType: 'text',
                                                    },
                                                    rule: {
                                                        effect: RuleEffect.HIDE,
                                                        condition: {
                                                            scope: '#/properties/id',
                                                            schema: { const: 'unraid.net' },
                                                        },
                                                    },
                                                }),
                                                createSimpleLabeledControl({
                                                    scope: '#/properties/clientSecret',
                                                    label: 'Client Secret:',
                                                    description:
                                                        'OAuth2 application client secret (optional)',
                                                    controlOptions: {
                                                        inputType: 'password',
                                                    },
                                                    rule: {
                                                        effect: RuleEffect.HIDE,
                                                        condition: {
                                                            scope: '#/properties/id',
                                                            schema: { const: 'unraid.net' },
                                                        },
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
                                                    rule: {
                                                        effect: RuleEffect.HIDE,
                                                        condition: {
                                                            scope: '#/properties/id',
                                                            schema: { const: 'unraid.net' },
                                                        },
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
                                                    rule: {
                                                        effect: RuleEffect.HIDE,
                                                        condition: {
                                                            scope: '#/properties/id',
                                                            schema: { const: 'unraid.net' },
                                                        },
                                                    },
                                                }),
                                            ],
                                        },
                                        {
                                            type: 'VerticalLayout',
                                            options: {
                                                accordion: {
                                                    title: 'Advanced Endpoints',
                                                    description:
                                                        'Override auto-discovery settings (optional)',
                                                },
                                            },
                                            rule: {
                                                effect: RuleEffect.HIDE,
                                                condition: {
                                                    scope: '#/properties/id',
                                                    schema: { const: 'unraid.net' },
                                                },
                                            },
                                            elements: [
                                                createSimpleLabeledControl({
                                                    scope: '#/properties/authorizationEndpoint',
                                                    label: 'Authorization Endpoint:',
                                                    description: 'Override auto-discovery (optional)',
                                                    controlOptions: {
                                                        inputType: 'url',
                                                    },
                                                    rule: {
                                                        effect: RuleEffect.HIDE,
                                                        condition: {
                                                            scope: '#/properties/id',
                                                            schema: { const: 'unraid.net' },
                                                        },
                                                    },
                                                }),
                                                createSimpleLabeledControl({
                                                    scope: '#/properties/tokenEndpoint',
                                                    label: 'Token Endpoint:',
                                                    description: 'Override auto-discovery (optional)',
                                                    controlOptions: {
                                                        inputType: 'url',
                                                    },
                                                    rule: {
                                                        effect: RuleEffect.HIDE,
                                                        condition: {
                                                            scope: '#/properties/id',
                                                            schema: { const: 'unraid.net' },
                                                        },
                                                    },
                                                }),
                                                createSimpleLabeledControl({
                                                    scope: '#/properties/jwksUri',
                                                    label: 'JWKS URI:',
                                                    description: 'Override auto-discovery (optional)',
                                                    controlOptions: {
                                                        inputType: 'url',
                                                    },
                                                    rule: {
                                                        effect: RuleEffect.HIDE,
                                                        condition: {
                                                            scope: '#/properties/id',
                                                            schema: { const: 'unraid.net' },
                                                        },
                                                    },
                                                }),
                                            ],
                                        },
                                        {
                                            type: 'VerticalLayout',
                                            options: {
                                                accordion: {
                                                    title: 'Authorization Rules',
                                                    description: 'Configure who can access your server',
                                                },
                                            },
                                            elements: [
                                                // Authorization Mode Toggle
                                                createSimpleLabeledControl({
                                                    scope: '#/properties/authorizationMode',
                                                    label: 'Authorization Mode:',
                                                    description:
                                                        'Choose between simple presets or advanced rule configuration',
                                                    controlOptions: {},
                                                }),
                                                // Simple Authorization Fields (shown when mode is 'simple')
                                                {
                                                    type: 'VerticalLayout',
                                                    rule: {
                                                        effect: RuleEffect.SHOW,
                                                        condition: {
                                                            scope: '#/properties/authorizationMode',
                                                            schema: { const: 'simple' },
                                                        },
                                                    },
                                                    elements: [
                                                        {
                                                            type: 'Label',
                                                            text: 'Simple Authorization',
                                                            options: {
                                                                description:
                                                                    'Configure who can login using simple presets. At least one field must be configured.',
                                                                format: 'title',
                                                            },
                                                        },
                                                        createSimpleLabeledControl({
                                                            scope: '#/properties/simpleAuthorization/properties/allowedDomains',
                                                            label: 'Allowed Email Domains:',
                                                            description:
                                                                'Users with emails ending in these domains can login (e.g., company.com)',
                                                            controlOptions: {
                                                                format: 'array',
                                                                inputType: 'text',
                                                                placeholder: 'company.com',
                                                            },
                                                        }),
                                                        createSimpleLabeledControl({
                                                            scope: '#/properties/simpleAuthorization/properties/allowedEmails',
                                                            label: 'Specific Email Addresses:',
                                                            description:
                                                                'Only these exact email addresses can login',
                                                            controlOptions: {
                                                                format: 'array',
                                                                inputType: 'email',
                                                                placeholder: 'user@example.com',
                                                            },
                                                        }),
                                                        createSimpleLabeledControl({
                                                            scope: '#/properties/simpleAuthorization/properties/allowedUserIds',
                                                            label: 'Allowed User IDs:',
                                                            description:
                                                                'Specific user IDs from the identity provider',
                                                            controlOptions: {
                                                                format: 'array',
                                                                inputType: 'text',
                                                                placeholder: 'user-id-123',
                                                            },
                                                        }),
                                                        // Google-specific field (shown only for Google providers)
                                                        {
                                                            type: 'VerticalLayout',
                                                            rule: {
                                                                effect: RuleEffect.SHOW,
                                                                condition: {
                                                                    scope: '#/properties/issuer',
                                                                    schema: { pattern: '.*google.*' },
                                                                },
                                                            },
                                                            elements: [
                                                                createSimpleLabeledControl({
                                                                    scope: '#/properties/simpleAuthorization/properties/googleWorkspaceDomain',
                                                                    label: 'Google Workspace Domain:',
                                                                    description:
                                                                        'Restrict to users from your Google Workspace domain',
                                                                    controlOptions: {
                                                                        inputType: 'text',
                                                                        placeholder: 'company.com',
                                                                    },
                                                                }),
                                                            ],
                                                        },
                                                    ],
                                                },
                                                // Advanced Authorization Rules (shown when mode is 'advanced' or authorizationRuleMode is 'and')
                                                {
                                                    type: 'VerticalLayout',
                                                    rule: {
                                                        effect: RuleEffect.SHOW,
                                                        condition: {
                                                            type: 'OR',
                                                            conditions: [
                                                                {
                                                                    scope: '#/properties/authorizationMode',
                                                                    schema: { const: 'advanced' },
                                                                },
                                                                {
                                                                    scope: '#/properties/authorizationRuleMode',
                                                                    schema: { const: 'and' },
                                                                },
                                                            ],
                                                        },
                                                    },
                                                    elements: [
                                                        {
                                                            type: 'Label',
                                                            text: 'Advanced Authorization Rules',
                                                            options: {
                                                                description:
                                                                    'Define authorization rules based on claims in the ID token. Rule mode can be configured: OR logic (any rule matches) or AND logic (all rules must match).',
                                                            },
                                                        },
                                                        createSimpleLabeledControl({
                                                            scope: '#/properties/authorizationRuleMode',
                                                            label: 'Rule Mode:',
                                                            description:
                                                                'How to evaluate multiple rules: OR (any rule passes) or AND (all rules must pass)',
                                                            controlOptions: {},
                                                        }),
                                                        {
                                                            type: 'Control',
                                                            scope: '#/properties/authorizationRules',
                                                            options: {
                                                                elementLabelFormat:
                                                                    '${claim} ${operator}',
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
                                                                                placeholder:
                                                                                    '@company.com',
                                                                            },
                                                                        }),
                                                                    ],
                                                                },
                                                            },
                                                        },
                                                    ],
                                                },
                                            ],
                                        },
                                        {
                                            type: 'VerticalLayout',
                                            options: {
                                                accordion: {
                                                    title: 'Button Customization',
                                                    description:
                                                        'Customize the appearance of the login button',
                                                },
                                            },
                                            rule: {
                                                effect: RuleEffect.HIDE,
                                                condition: {
                                                    scope: '#/properties/id',
                                                    schema: { const: 'unraid.net' },
                                                },
                                            },
                                            elements: [
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
                                                    description:
                                                        'Icon URL or base64 data URI (optional)',
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
                                    ],
                                }),
                            },
                        },
                    ],
                },
            ],
        };
    }
}
