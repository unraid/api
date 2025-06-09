import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { mergeSettingSlices } from '@unraid/shared/jsonforms/settings.js';
import { type ApiConfig } from '@unraid/shared/services/api-config.js';
import { UserSettingsService } from '@unraid/shared/services/user-settings.js';

import { SsoUserService } from '@app/unraid-api/auth/sso-user.service.js';
import { createLabeledControl } from '@app/unraid-api/graph/utils/form-utils.js';
import { SettingSlice } from '@app/unraid-api/types/json-forms.js';

@Injectable()
export class ApiSettings {
    constructor(
        private readonly userSettings: UserSettingsService,
        private readonly configService: ConfigService<{ api: ApiConfig }, true>,
        private readonly ssoUserService: SsoUserService
    ) {
        this.userSettings.register('api', {
            buildSlice: async () => this.buildSlice(),
            getCurrentValues: async () => this.getSettings(),
            updateValues: async (settings: Partial<ApiConfig>) => this.updateSettings(settings),
        });
    }

    getSettings(): ApiConfig {
        return {
            version: this.configService.get('api.version', { infer: true }),
            sandbox: this.configService.get('api.sandbox', { infer: true }),
            extraOrigins: this.configService.get('api.extraOrigins', { infer: true }),
            ssoSubIds: this.configService.get('api.ssoSubIds', { infer: true }),
        };
    }

    async updateSettings(settings: Partial<ApiConfig>) {
        let restartRequired = false;
        if (typeof settings.sandbox === 'boolean') {
            const currentSandbox = this.configService.get('api.sandbox', { infer: true });
            restartRequired ||= settings.sandbox !== currentSandbox;
            // @ts-expect-error - depend on the configService.get calls above for type safety
            this.configService.set('api.sandbox', settings.sandbox);
        }
        if (settings.ssoSubIds) {
            const ssoNeedsRestart = await this.ssoUserService.setSsoUsers(settings.ssoSubIds);
            restartRequired ||= ssoNeedsRestart;
        }
        if (settings.extraOrigins) {
            // @ts-expect-error
            this.configService.set('api.extraOrigins', settings.extraOrigins);
        }
        return { restartRequired, values: await this.getSettings() };
    }

    buildSlice(): SettingSlice {
        return mergeSettingSlices([
            this.sandboxSlice(),
            this.ssoUsersSlice(),
            // Because CORS is effectively disabled, this setting is no longer necessary
            // keeping it here for in case it needs to be re-enabled
            //
            // this.extraOriginsSlice(),
        ]);
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
                    scope: '#/properties/sandbox',
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
     */
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
                    scope: '#/properties/extraOrigins',
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
    }

    /**
     * SSO users settings slice
     */
    private ssoUsersSlice(): SettingSlice {
        return {
            properties: {
                ssoUserIds: {
                    type: 'array',
                    items: {
                        type: 'string',
                    },
                    title: 'Unraid API SSO Users',
                    description: `Provide a list of Unique Unraid Account ID's. Find yours at <a href="https://account.unraid.net/settings" target="_blank" rel="noopener noreferrer">account.unraid.net/settings</a>. Requires restart if adding first user.`,
                },
            },
            elements: [
                createLabeledControl({
                    scope: '#/properties/ssoUserIds',
                    label: 'Unraid Connect SSO Users',
                    description: `Provide a list of Unique Unraid Account IDs. Find yours at <a href="https://account.unraid.net/settings" target="_blank" rel="noopener noreferrer">account.unraid.net/settings</a>. Requires restart if adding first user.`,
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
