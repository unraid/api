import { Injectable, Logger } from '@nestjs/common';

import type { SchemaBasedCondition } from '@jsonforms/core';
import { RuleEffect } from '@jsonforms/core';
import { execa } from 'execa';
import { GraphQLError } from 'graphql/error/GraphQLError.js';
import { decodeJwt } from 'jose';

import type {
    ApiSettingsInput,
    ConnectSettingsValues,
    ConnectSignInInput,
    EnableDynamicRemoteAccessInput,
    RemoteAccess,
    SetupRemoteAccessInput,
} from '@app/unraid-api/graph/resolvers/connect/connect.model.js';
import type { DataSlice, SettingSlice, UIElement } from '@app/unraid-api/types/json-forms.js';
import { getExtraOrigins } from '@app/common/allowed-origins.js';
import { fileExistsSync } from '@app/core/utils/files/file-exists.js';
import { setupRemoteAccessThunk } from '@app/store/actions/setup-remote-access.js';
import {
    loginUser,
    setSsoUsers,
    updateAllowedOrigins,
    updateUserConfig,
} from '@app/store/modules/config.js';
import { setAllowedRemoteAccessUrl } from '@app/store/modules/dynamic-remote-access.js';
import { FileLoadStatus } from '@app/store/types.js';
import { ApiKeyService } from '@app/unraid-api/auth/api-key.service.js';
import {
    DynamicRemoteAccessType,
    URL_TYPE,
    WAN_ACCESS_TYPE,
    WAN_FORWARD_TYPE,
} from '@app/unraid-api/graph/resolvers/connect/connect.model.js';
import { mergeSettingSlices } from '@app/unraid-api/types/json-forms.js';
import { csvStringToArray } from '@app/utils.js';

@Injectable()
export class ConnectSettingsService {
    constructor(private readonly apiKeyService: ApiKeyService) {}

    private readonly logger = new Logger(ConnectSettingsService.name);

    async restartApi() {
        try {
            await execa('unraid-api', ['restart'], { shell: 'bash', stdio: 'ignore' });
        } catch (error) {
            this.logger.error(error);
        }
    }

    public async extraAllowedOrigins(): Promise<Array<string>> {
        const extraOrigins = getExtraOrigins();
        return extraOrigins;
    }

    isConnectPluginInstalled(): boolean {
        return ['/var/lib/pkgtools/packages/dynamix.unraid.net', '/usr/local/bin/unraid-api'].some(
            (path) => fileExistsSync(path)
        );
    }

    public async enableDynamicRemoteAccess(input: EnableDynamicRemoteAccessInput): Promise<boolean> {
        const { store } = await import('@app/store/index.js');
        const { RemoteAccessController } = await import('@app/remoteAccess/remote-access-controller.js');
        // Start or extend dynamic remote access
        const state = store.getState();

        const { dynamicRemoteAccessType } = state.config.remote;
        if (!dynamicRemoteAccessType || dynamicRemoteAccessType === DynamicRemoteAccessType.DISABLED) {
            throw new GraphQLError('Dynamic Remote Access is not enabled.', {
                extensions: { code: 'FORBIDDEN' },
            });
        }

        const controller = RemoteAccessController.instance;

        if (input.enabled === false) {
            await controller.stopRemoteAccess({
                getState: store.getState,
                dispatch: store.dispatch,
            });
            return true;
        } else if (controller.getRunningRemoteAccessType() === DynamicRemoteAccessType.DISABLED) {
            if (input.url) {
                store.dispatch(setAllowedRemoteAccessUrl(input.url));
            }
            await controller.beginRemoteAccess({
                getState: store.getState,
                dispatch: store.dispatch,
            });
        } else {
            controller.extendRemoteAccess({
                getState: store.getState,
                dispatch: store.dispatch,
            });
        }
        return true;
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
        const { local, api, remote } = getters.config();
        return {
            ...(await this.dynamicRemoteAccessSettings()),
            sandbox: local.sandbox === 'yes',
            extraOrigins: csvStringToArray(api.extraOrigins),
            ssoUserIds: csvStringToArray(remote.ssoSubIds),
        };
    }

    /**
     * Syncs the settings to the store and writes the config to disk
     * @param settings - The settings to sync
     * @returns true if a restart is required, false otherwise
     */
    async syncSettings(settings: Partial<ApiSettingsInput>): Promise<boolean> {
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
        if (settings.ssoUserIds) {
            restartRequired ||= await this.updateSSOUsers(settings.ssoUserIds);
        }
        const { writeConfigSync } = await import('@app/store/sync/config-disk-sync.js');
        writeConfigSync('flash');
        return restartRequired;
    }

    private async updateAllowedOrigins(origins: string[]) {
        const { store } = await import('@app/store/index.js');
        store.dispatch(updateAllowedOrigins(origins));
    }

    private async getOrCreateLocalApiKey() {
        const { getters } = await import('@app/store/index.js');
        const { localApiKey: localApiKeyFromConfig } = getters.config().remote;
        if (localApiKeyFromConfig === '') {
            const localApiKey = await this.apiKeyService.createLocalConnectApiKey();
            if (!localApiKey?.key) {
                throw new GraphQLError('Failed to create local API key', {
                    extensions: { code: 'INTERNAL_SERVER_ERROR' },
                });
            }
            return localApiKey.key;
        }
        return localApiKeyFromConfig;
    }

    async signIn(input: ConnectSignInInput) {
        const { getters, store } = await import('@app/store/index.js');
        if (getters.emhttp().status === FileLoadStatus.LOADED) {
            const userInfo = input.idToken ? decodeJwt(input.idToken) : (input.userInfo ?? null);

            if (
                !userInfo ||
                !userInfo.preferred_username ||
                !userInfo.email ||
                typeof userInfo.preferred_username !== 'string' ||
                typeof userInfo.email !== 'string'
            ) {
                throw new GraphQLError('Missing User Attributes', {
                    extensions: { code: 'BAD_REQUEST' },
                });
            }

            try {
                const localApiKey = await this.getOrCreateLocalApiKey();

                await store.dispatch(
                    loginUser({
                        avatar: typeof userInfo.avatar === 'string' ? userInfo.avatar : '',
                        username: userInfo.preferred_username,
                        email: userInfo.email,
                        apikey: input.apiKey,
                        localApiKey,
                    })
                );

                return true;
            } catch (error) {
                throw new GraphQLError(`Failed to login user: ${error}`, {
                    extensions: { code: 'INTERNAL_SERVER_ERROR' },
                });
            }
        } else {
            return false;
        }
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

    /**
     * Updates the SSO users and returns true if a restart is required
     * @param userIds - The list of SSO user IDs
     * @returns true if a restart is required, false otherwise
     */
    private async updateSSOUsers(userIds: string[]): Promise<boolean> {
        const { ssoUserIds } = await this.getCurrentSettings();
        const currentUserSet = new Set(ssoUserIds);
        const newUserSet = new Set(userIds);
        if (newUserSet.symmetricDifference(currentUserSet).size === 0) {
            // there's no change, so no need to update
            return false;
        }
        // make sure we aren't adding invalid user ids
        const uuidRegex =
            /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
        const invalidUserIds = userIds.filter((id) => !uuidRegex.test(id));
        if (invalidUserIds.length > 0) {
            throw new GraphQLError(`Invalid SSO user ID's: ${invalidUserIds.join(', ')}`);
        }
        const { store } = await import('@app/store/index.js');
        store.dispatch(setSsoUsers(userIds));
        // request a restart if we're there were no sso users before
        return currentUserSet.size === 0;
    }

    private async updateRemoteAccess(input: SetupRemoteAccessInput): Promise<boolean> {
        const { store } = await import('@app/store/index.js');
        await store.dispatch(setupRemoteAccessThunk(input)).unwrap();
        return true;
    }

    public async dynamicRemoteAccessSettings(): Promise<RemoteAccess> {
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
            this.ssoUsersSlice(),
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
        const isSignedIn = await this.isSignedIn();
        const isSSLCertProvisioned = await this.isSSLCertProvisioned();
        const precondition = isSignedIn && isSSLCertProvisioned;

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
                            status: isSignedIn,
                        },
                        {
                            text: 'You have provisioned a valid SSL certificate',
                            status: isSSLCertProvisioned,
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

    /**
     * Extra origins settings slice
     */
    ssoUsersSlice(): SettingSlice {
        return {
            properties: {
                ssoUserIds: {
                    type: 'array',
                    items: {
                        type: 'string',
                    },
                    title: 'Unraid API SSO Users',
                    description: `Provide a list of Unique Unraid Account ID's. Find yours at <a href="https://account.unraid.net/settings" target="_blank">account.unraid.net/settings</a>`,
                },
            },
            elements: [
                {
                    type: 'Control',
                    scope: '#/properties/ssoUserIds',
                    options: {
                        inputType: 'text',
                        placeholder: 'UUID',
                    },
                },
            ],
        };
    }
}
