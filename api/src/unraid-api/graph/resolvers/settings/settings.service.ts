import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { JsonSchema, JsonSchema7 } from '@jsonforms/core';
import { DataSlice, mergeSettingSlices } from '@unraid/shared/jsonforms/settings.js';
import { type ApiConfig } from '@unraid/shared/services/api-config.js';
import { UserSettingsService } from '@unraid/shared/services/user-settings.js';
import { execa } from 'execa';

import { OidcConfigPersistence } from '@app/unraid-api/graph/resolvers/sso/oidc-config.service.js';
import { createLabeledControl } from '@app/unraid-api/graph/utils/form-utils.js';
import { SettingSlice } from '@app/unraid-api/types/json-forms.js';

@Injectable()
export class ApiSettings {
    private readonly logger = new Logger(ApiSettings.name);
    constructor(
        private readonly userSettings: UserSettingsService,
        private readonly configService: ConfigService<{ api: ApiConfig }, true>,
        private readonly oidcConfig: OidcConfigPersistence
    ) {
        this.userSettings.register('api', {
            buildSlice: async () => this.buildSlice(),
            getCurrentValues: async () => this.getSettings(),
            updateValues: async (settings: Partial<ApiConfig>) => this.updateSettings(settings),
        });
    }

    private async shouldShowSsoUsersSettings(): Promise<boolean> {
        // SSO users are now managed through OIDC provider configuration
        // This legacy setting is no longer shown
        return false;
    }

    getSettings(): ApiConfig {
        return {
            version: this.configService.get('api.version', { infer: true }),
            sandbox: this.configService.get('api.sandbox', { infer: true }),
            extraOrigins: this.configService.get('api.extraOrigins', { infer: true }),
            ssoSubIds: this.configService.get('api.ssoSubIds', { infer: true }),
            plugins: this.configService.get('api.plugins', { infer: true }),
        };
    }

    async updateSettings(settings: Partial<ApiConfig>) {
        const restartRequired = false;
        if (typeof settings.sandbox === 'boolean') {
            // @ts-expect-error - depend on the configService.get calls above for type safety
            this.configService.set('api.sandbox', settings.sandbox);
        }
        // SSO user IDs are now managed through OIDC provider configuration
        // Migration happens automatically when OIDC config is created
        if (settings.extraOrigins) {
            // @ts-expect-error - this is correct, but the configService typescript implementation is too narrow
            this.configService.set('api.extraOrigins', settings.extraOrigins);
        }
        return { restartRequired, values: await this.getSettings() };
    }

    async buildSlice(): Promise<SettingSlice> {
        const slices: SettingSlice[] = [this.sandboxSlice()];

        // Only show SSO users setting if migration hasn't happened yet
        if (await this.shouldShowSsoUsersSettings()) {
            slices.push(this.ssoUsersSlice());
        }

        // Because CORS is effectively disabled, this setting is no longer necessary
        // keeping it here for in case it needs to be re-enabled
        // slices.push(this.extraOriginsSlice());

        return mergeSettingSlices(slices, { as: 'api' });
    }

    /**
     * Developer sandbox settings slice
     */
    private sandboxSlice(): SettingSlice {
        const { sandbox } = this.getSettings();
        const description =
            'The developer sandbox is available at <code><a class="underline" href="/graphql" target="_blank">/graphql</a></code>.';
        return {
            properties: {
                sandbox: {
                    type: 'boolean',
                    title: 'Enable Developer Sandbox',
                    default: false,
                },
            },
            elements: [
                createLabeledControl({
                    scope: '#/properties/api/properties/sandbox',
                    label: 'Enable Developer Sandbox:',
                    description: sandbox ? description : undefined,
                    controlOptions: {
                        toggle: true,
                    },
                }),
            ],
        };
    }

    /**
     * Extra origins settings slice
    private extraOriginsSlice(): SettingSlice {
        return {
            properties: {
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
            elements: [
                createLabeledControl({
                    scope: '#/properties/api/properties/extraOrigins',
                    label: 'Allowed Origins (CORS)',
                    description:
                        'Provide a comma-separated list of URLs allowed to access the API (e.g., https://myapp.example.com).',
                    controlOptions: {
                        inputType: 'url',
                        placeholder: 'https://example.com',
                        format: 'array',
                    },
                }),
            ],
        };
    } */

    /**
     * SSO users settings slice
     */
    private ssoUsersSlice(): SettingSlice {
        return {
            properties: {
                ssoSubIds: {
                    type: 'array',
                    items: {
                        type: 'string',
                    },
                    title: 'Unraid API SSO Users',
                    description: `Provide a list of Unique Unraid Account ID's. Find yours at <a href="https://account.unraid.net/settings" target="_blank" rel="noopener noreferrer">account.unraid.net/settings</a>.`,
                },
            },
            elements: [
                createLabeledControl({
                    scope: '#/properties/api/properties/ssoSubIds',
                    label: 'Unraid Connect SSO Users:',
                    description: `Provide a list of Unique Unraid Account IDs. Find yours at <a href="https://account.unraid.net/settings" target="_blank" rel="noopener noreferrer">account.unraid.net/settings</a>.`,
                    controlOptions: {
                        inputType: 'text',
                        placeholder: 'UUID',
                        format: 'array',
                    },
                }),
            ],
        };
    }
}
