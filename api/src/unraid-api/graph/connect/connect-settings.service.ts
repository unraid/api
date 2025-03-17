import { Injectable } from '@nestjs/common';

import type { SchemaBasedCondition } from '@jsonforms/core';
import { RuleEffect } from '@jsonforms/core';
import { GraphQLError } from 'graphql/error/GraphQLError.js';

import type {
    ApiSettingsInput,
    ConnectSettingsValues,
    RemoteAccess,
    SetupRemoteAccessInput,
} from '@app/graphql/generated/api/types.js';
import type { DataSlice, SettingSlice, UIElement } from '@app/unraid-api/types/json-forms.js';
import { fileExistsSync } from '@app/core/utils/files/file-exists.js';
import {
    DynamicRemoteAccessType,
    WAN_ACCESS_TYPE,
    WAN_FORWARD_TYPE,
} from '@app/graphql/generated/api/types.js';
import { setupRemoteAccessThunk } from '@app/store/actions/setup-remote-access.js';
import { updateAllowedOrigins, updateUserConfig } from '@app/store/modules/config.js';
import { mergeSettingSlices } from '@app/unraid-api/types/json-forms.js';
import { csvStringToArray } from '@app/utils.js';

@Injectable()
export class ConnectSettingsService {
    isConnectPluginInstalled(): boolean {
        // logic ported from webguid
        return ['/var/lib/pkgtools/packages/dynamix.unraid.net', '/usr/local/sbin/unraid-api'].every(
            (path) => fileExistsSync(path)
        );
    }

    async isSignedIn(): Promise<boolean> {
        if (!this.isConnectPluginInstalled()) return false;
        const { getters } = await import('@app/store/index.js');
        const { apikey } = getters.config().remote;
        return Boolean(apikey) && apikey.trim().length > 0;
    }

    async isSSLCertProvisioned(): Promise<boolean> {
        const { getters } = await import('@app/store/index.js');
        const { nginx } = getters.emhttp();
        return nginx.certificateName.endsWith('.myunraid.net');
    }

    /**------------------------------------------------------------------------
     *                           Settings Form Data
     *------------------------------------------------------------------------**/

    async getCurrentSettings(): Promise<ConnectSettingsValues> {
        const { getters } = await import('@app/store/index.js');
        const { local, api } = getters.config();
        return {
            ...(await this.dynamicRemoteAccessSettings()),
            sandbox: local.sandbox === 'yes',
            extraOrigins: csvStringToArray(api.extraOrigins),
        };
    }

    /**
     * Syncs the settings to the store and writes the config to disk
     * @param settings - The settings to sync
     * @returns true if a restart is required, false otherwise
     */
    async syncSettings(settings: Partial<ApiSettingsInput>) {
        let restartRequired = false;
        const { getters } = await import('@app/store/index.js');
        const { nginx } = getters.emhttp();
        if (settings.accessType === WAN_ACCESS_TYPE.DISABLED) {
            settings.port = null;
        }
        if (
            !nginx.sslEnabled &&
            settings.accessType === WAN_ACCESS_TYPE.DYNAMIC &&
            settings.forwardType === WAN_FORWARD_TYPE.STATIC
        ) {
            throw new GraphQLError(
                'SSL must be provisioned and enabled for dynamic access and static port forwarding.'
            );
        }
        if (settings.accessType) {
            await this.updateRemoteAccess({
                accessType: settings.accessType,
                forwardType: settings.forwardType,
                port: settings.port,
            });
        }

        if (settings.extraOrigins) {
            await this.updateAllowedOrigins(settings.extraOrigins);
        }
        if (typeof settings.sandbox === 'boolean') {
            restartRequired ||= await this.setSandboxMode(settings.sandbox);
        }
        const { writeConfigSync } = await import('@app/store/sync/config-disk-sync.js');
        writeConfigSync('flash');
        return restartRequired;
    }

    private async updateAllowedOrigins(origins: string[]) {
        const { store } = await import('@app/store/index.js');
        store.dispatch(updateAllowedOrigins(origins));
    }

    /**
     * Sets the sandbox mode and returns true if the mode was changed
     * @param sandboxEnabled - Whether to enable sandbox mode
     * @returns true if the mode was changed, false otherwise
     */
    private async setSandboxMode(sandboxEnabled: boolean): Promise<boolean> {
        const { store, getters } = await import('@app/store/index.js');
        const currentSandbox = getters.config().local.sandbox;
        const sandbox = sandboxEnabled ? 'yes' : 'no';
        if (currentSandbox === sandbox) return false;
        store.dispatch(updateUserConfig({ local: { sandbox } }));
        return true;
    }

    private async updateRemoteAccess(input: SetupRemoteAccessInput): Promise<boolean> {
        const { store } = await import('@app/store/index.js');
        await store.dispatch(setupRemoteAccessThunk(input)).unwrap();
        return true;
    }

    private async dynamicRemoteAccessSettings(): Promise<Omit<RemoteAccess, '__typename'>> {
        const { getters } = await import('@app/store/index.js');
        const hasWanAccess = getters.config().remote.wanaccess === 'yes';
        return {
            accessType: hasWanAccess
                ? getters.config().remote.dynamicRemoteAccessType !== DynamicRemoteAccessType.DISABLED
                    ? WAN_ACCESS_TYPE.DYNAMIC
                    : WAN_ACCESS_TYPE.ALWAYS
                : WAN_ACCESS_TYPE.DISABLED,
            forwardType: getters.config().remote.upnpEnabled
                ? WAN_FORWARD_TYPE.UPNP
                : WAN_FORWARD_TYPE.STATIC,
            port: getters.config().remote.wanport ? Number(getters.config().remote.wanport) : null,
        };
    }

    /**------------------------------------------------------------------------
     *                           Settings Form Slices
     *------------------------------------------------------------------------**/

    /**
     * Builds the complete settings schema
     */
    async buildSettingsSchema(): Promise<SettingSlice> {
        const slices = [
            await this.remoteAccessSlice(),
            await this.sandboxSlice(),
            this.flashBackupSlice(),
            // Because CORS is effectively disabled, this setting is no longer necessary
            // keeping it here for in case it needs to be re-enabled
            //
            // this.extraOriginsSlice(),
        ];

        return mergeSettingSlices(slices);
    }

    /**
     * Computes the JSONForms schema definition for remote access settings.
     */
    async remoteAccessSlice(): Promise<SettingSlice> {
        const precondition = (await this.isSignedIn()) && (await this.isSSLCertProvisioned());

        /** shown when preconditions are not met */
        const requirements: UIElement[] = [
            {
                type: 'Label',
                text: 'Allow Remote Access',
                options: {
                    format: 'preconditions',
                    description: 'Remote Access is disabled. To enable, please make sure:',
                    items: [
                        {
                            text: 'You are signed in to Unraid Connect',
                            status: await this.isSignedIn(),
                        },
                        {
                            text: 'You have provisioned a valid SSL certificate',
                            status: await this.isSSLCertProvisioned(),
                        },
                    ],
                },
            },
        ];

        /** shown when preconditions are met */
        const formControls: UIElement[] = [
            {
                type: 'Control',
                scope: '#/properties/accessType',
                label: 'Allow Remote Access',
            },
            {
                type: 'Control',
                scope: '#/properties/forwardType',
                label: 'Remote Access Forward Type',
                rule: {
                    effect: RuleEffect.DISABLE,
                    condition: {
                        scope: '#/properties/accessType',
                        schema: {
                            enum: [WAN_ACCESS_TYPE.DISABLED],
                        },
                    } as SchemaBasedCondition,
                },
            },
            {
                type: 'Control',
                scope: '#/properties/port',
                label: 'Remote Access WAN Port',
                options: {
                    format: 'short',
                    formatOptions: {
                        useGrouping: false,
                    },
                },
                rule: {
                    effect: RuleEffect.SHOW,
                    condition: {
                        schema: {
                            properties: {
                                forwardType: {
                                    enum: [WAN_FORWARD_TYPE.STATIC],
                                },
                                accessType: {
                                    enum: [WAN_ACCESS_TYPE.DYNAMIC, WAN_ACCESS_TYPE.ALWAYS],
                                },
                            },
                        },
                    } as Omit<SchemaBasedCondition, 'scope'>,
                },
            },
        ];

        /** shape of the data associated with remote access settings, as json schema properties*/
        const properties: DataSlice = {
            accessType: {
                type: 'string',
                enum: Object.values(WAN_ACCESS_TYPE),
                title: 'Allow Remote Access',
                default: 'DISABLED',
            },
            forwardType: {
                type: 'string',
                enum: Object.values(WAN_FORWARD_TYPE),
                title: 'Forward Type',
                default: 'STATIC',
            },
            port: {
                type: 'number',
                title: 'WAN Port',
                minimum: 0,
                maximum: 65535,
                default: 0,
            },
        };

        return {
            properties,
            elements: precondition ? formControls : requirements,
        };
    }

    /**
     * Developer sandbox settings slice
     */
    async sandboxSlice(): Promise<SettingSlice> {
        const { sandbox } = await this.getCurrentSettings();
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
                {
                    type: 'Control',
                    scope: '#/properties/sandbox',
                    label: 'Enable Developer Sandbox:',
                    options: {
                        toggle: true,
                        description: sandbox ? description : undefined,
                    },
                },
            ],
        };
    }

    /**
     * Flash backup settings slice
     */
    flashBackupSlice(): SettingSlice {
        return {
            properties: {
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
            },
            elements: [], // No UI elements needed for this system-managed setting
        };
    }

    /**
     * Extra origins settings slice
     */
    extraOriginsSlice(): SettingSlice {
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
