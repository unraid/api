import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';

import type { JsonSchema7, SchemaBasedCondition } from '@jsonforms/core';
import type { DataSlice, SettingSlice, UIElement } from '@unraid/shared/jsonforms/settings.js';
import { RuleEffect } from '@jsonforms/core';
import { createLabeledControl } from '@unraid/shared/jsonforms/control.js';
import { mergeSettingSlices } from '@unraid/shared/jsonforms/settings.js';
import { URL_TYPE } from '@unraid/shared/network.model.js';
import { UserSettingsService } from '@unraid/shared/services/user-settings.js';
import { execa } from 'execa';
import { GraphQLError } from 'graphql/error/GraphQLError.js';
import { decodeJwt } from 'jose';

import type {
    ConnectSettingsInput,
    ConnectSettingsValues,
    ConnectSignInInput,
    EnableDynamicRemoteAccessInput,
    RemoteAccess,
    SetupRemoteAccessInput,
} from './connect.model.js';
import { ConnectApiKeyService } from '../authn/connect-api-key.service.js';
import { ConfigType, MyServersConfig } from '../config/connect.config.js';
import { EVENTS } from '../helper/nest-tokens.js';
import { DynamicRemoteAccessType, WAN_ACCESS_TYPE, WAN_FORWARD_TYPE } from './connect.model.js';
import { DynamicRemoteAccessService } from '../remote-access/dynamic-remote-access.service.js';
import { NetworkService } from '../network/network.service.js';

declare module '@unraid/shared/services/user-settings.js' {
    interface UserSettings {
        'remote-access': RemoteAccess;
    }
}

@Injectable()
export class ConnectSettingsService {
    constructor(
        private readonly configService: ConfigService<ConfigType>,
        private readonly remoteAccess: DynamicRemoteAccessService,
        private readonly apiKeyService: ConnectApiKeyService,
        private readonly eventEmitter: EventEmitter2,
        private readonly userSettings: UserSettingsService,
        private readonly networkService: NetworkService
    ) {
        this.userSettings.register('remote-access', {
            buildSlice: async () => this.buildRemoteAccessSlice(),
            getCurrentValues: async () => this.getCurrentSettings(),
            updateValues: async (settings: Partial<RemoteAccess>) => {
                await this.syncSettings(settings);
                return {
                    restartRequired: false,
                    values: await this.getCurrentSettings(),
                };
            },
        });
    }

    private readonly logger = new Logger(ConnectSettingsService.name);

    async restartApi() {
        try {
            await execa('unraid-api', ['restart'], { shell: 'bash', stdio: 'ignore' });
        } catch (error) {
            this.logger.error(error);
        }
    }

    public async extraAllowedOrigins(): Promise<Array<string>> {
        return this.configService.get('api.extraOrigins', []);
    }

    isConnectPluginInstalled(): boolean {
        return true;
    }

    public async enableDynamicRemoteAccess(input: EnableDynamicRemoteAccessInput) {
        const { dynamicRemoteAccessType } =
            this.configService.getOrThrow<MyServersConfig>('connect.config');
        if (!dynamicRemoteAccessType || dynamicRemoteAccessType === DynamicRemoteAccessType.DISABLED) {
            throw new GraphQLError('Dynamic Remote Access is not enabled.', {
                extensions: { code: 'FORBIDDEN' },
            });
        }
        await this.remoteAccess.enableDynamicRemoteAccess({
            allowedUrl: {
                ipv4: input.url.ipv4?.toString() ?? null,
                ipv6: input.url.ipv6?.toString() ?? null,
                type: input.url.type,
                name: input.url.name,
            },
            type: dynamicRemoteAccessType,
        });
    }

    async isSignedIn(): Promise<boolean> {
        const { apikey } = this.configService.getOrThrow<MyServersConfig>('connect.config');
        return Boolean(apikey) && apikey.trim().length > 0;
    }

    async isSSLCertProvisioned(): Promise<boolean> {
        const { certificateName = '' } = this.configService.get('store.emhttp.nginx', {});
        return certificateName?.endsWith('.myunraid.net') ?? false;
    }

    /**------------------------------------------------------------------------
     *                           Settings Form Data
     *------------------------------------------------------------------------**/

    async getCurrentSettings(): Promise<ConnectSettingsValues> {
        // const connect = this.configService.getOrThrow<ConnectConfig>('connect');
        return {
            ...(await this.dynamicRemoteAccessSettings()),
        };
    }

    /**
     * Syncs the settings to the store and writes the config to disk
     * @param settings - The settings to sync
     * @returns true if a restart is required, false otherwise
     */
    async syncSettings(settings: Partial<ConnectSettingsInput>): Promise<boolean> {
        let restartRequired = false;
        const { nginx } = this.configService.getOrThrow('store.emhttp');
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
        // const { writeConfigSync } = await import('@app/store/sync/config-disk-sync.js');
        // writeConfigSync('flash');
        return restartRequired;
    }

    async signIn(input: ConnectSignInInput) {
        const status = this.configService.get('store.emhttp.status');
        if (status === 'LOADED') {
            const userInfo = input.userInfo ?? null;

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
                // Make sure we have a local API key for Connect
                await this.apiKeyService.getOrCreateLocalApiKey();

                // Update config with user info
                this.configService.set(
                    'connect.config.avatar',
                    typeof userInfo.avatar === 'string' ? userInfo.avatar : ''
                );
                this.configService.set('connect.config.username', userInfo.preferred_username);
                this.configService.set('connect.config.email', userInfo.email);
                this.configService.set('connect.config.apikey', input.apiKey);

                // Emit login event
                this.eventEmitter.emit(EVENTS.LOGIN, {
                    username: userInfo.preferred_username,
                    avatar: typeof userInfo.avatar === 'string' ? userInfo.avatar : '',
                    email: userInfo.email,
                    apikey: input.apiKey,
                });

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

    private getDynamicRemoteAccessType(
        accessType: WAN_ACCESS_TYPE,
        forwardType?: WAN_FORWARD_TYPE | undefined | null
    ): DynamicRemoteAccessType {
        // If access is disabled or always, DRA is disabled
        if (accessType === WAN_ACCESS_TYPE.DISABLED) {
            return DynamicRemoteAccessType.DISABLED;
        }
        // if access is enabled and forward type is UPNP, DRA is UPNP, otherwise it is static
        return forwardType === WAN_FORWARD_TYPE.UPNP
            ? DynamicRemoteAccessType.UPNP
            : DynamicRemoteAccessType.STATIC;
    }

    private async updateRemoteAccess(input: SetupRemoteAccessInput): Promise<boolean> {
        const dynamicRemoteAccessType = this.getDynamicRemoteAccessType(
            input.accessType,
            input.forwardType
        );

        this.configService.set('connect.config.wanaccess', input.accessType === WAN_ACCESS_TYPE.ALWAYS);
        if (input.forwardType === WAN_FORWARD_TYPE.STATIC) {
            this.configService.set('connect.config.wanport', input.port);
            // when forwarding with upnp, the upnp service will clear & set the wanport as necessary
        }
        this.configService.set(
            'connect.config.upnpEnabled',
            input.forwardType === WAN_FORWARD_TYPE.UPNP
        );

        // Use the dynamic remote access service to handle the transition
        await this.remoteAccess.enableDynamicRemoteAccess({
            type: dynamicRemoteAccessType,
            allowedUrl: {
                ipv4: null,
                ipv6: null,
                type: URL_TYPE.WAN,
                name: null,
            },
        });

        await this.networkService.reloadNetworkStack();

        return true;
    }

    public async dynamicRemoteAccessSettings(): Promise<RemoteAccess> {
        const config = this.configService.getOrThrow<MyServersConfig>('connect.config');
        return {
            accessType: config.wanaccess ? WAN_ACCESS_TYPE.ALWAYS : WAN_ACCESS_TYPE.DISABLED,
            forwardType: config.upnpEnabled ? WAN_FORWARD_TYPE.UPNP : WAN_FORWARD_TYPE.STATIC,
            port: config.wanport ? Number(config.wanport) : null,
        };
    }

    /**------------------------------------------------------------------------
     *                           Settings Form Slices
     *------------------------------------------------------------------------**/

    async buildRemoteAccessSlice(): Promise<SettingSlice> {
        const slice = await this.remoteAccessSlice();
        /**------------------------------------------------------------------------
         *                  UX: Only validate 'port' when relevant
         *
         * 'port' will be null when remote access is disabled, and it's irrelevant
         * when using upnp (because it becomes read-only for the end-user).
         *
         * In these cases, we should omit type and range validation for 'port'
         * to avoid confusing end-users.
         *
         * But, when using static port forwarding, 'port' is required, so we validate it.
         *------------------------------------------------------------------------**/
        return {
            properties: {
                'remote-access': {
                    type: 'object',
                    properties: slice.properties as JsonSchema7['properties'],
                    allOf: [
                        {
                            if: {
                                properties: {
                                    forwardType: { const: WAN_FORWARD_TYPE.STATIC },
                                    accessType: { const: WAN_ACCESS_TYPE.ALWAYS },
                                },
                                required: ['forwardType', 'accessType'],
                            },
                            then: {
                                required: ['port'],
                                properties: {
                                    port: {
                                        type: 'number',
                                        minimum: 1,
                                        maximum: 65535,
                                    },
                                },
                            },
                        },
                    ],
                },
            },
            elements: slice.elements,
        };
    }

    buildFlashBackupSlice(): SettingSlice {
        return mergeSettingSlices([this.flashBackupSlice()], {
            as: 'flash-backup',
        });
    }

    /**
     * Computes the JSONForms schema definition for remote access settings.
     */
    async remoteAccessSlice(): Promise<SettingSlice> {
        const isSignedIn = await this.isSignedIn();
        const isSSLCertProvisioned = await this.isSSLCertProvisioned();
        const { sslEnabled } = this.configService.getOrThrow('store.emhttp.nginx');
        const precondition = isSignedIn && isSSLCertProvisioned && sslEnabled;

        /** shown when preconditions are not met */
        const requirements: UIElement[] = [
            {
                type: 'UnraidSettingsLayout',
                elements: [
                    {
                        type: 'Label',
                        text: 'Allow Remote Access:',
                    },
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
                                {
                                    text: 'SSL is enabled',
                                    status: sslEnabled,
                                },
                            ],
                        },
                    },
                ],
            },
        ];

        /** shown when preconditions are met */
        const formControls: UIElement[] = [
            createLabeledControl({
                scope: '#/properties/remote-access/properties/accessType',
                label: 'Allow Remote Access',
                controlOptions: {},
            }),
            createLabeledControl({
                scope: '#/properties/remote-access/properties/forwardType',
                label: 'Remote Access Forward Type',
                controlOptions: {},
                rule: {
                    effect: RuleEffect.DISABLE,
                    condition: {
                        scope: '#/properties/remote-access/properties/accessType',
                        schema: {
                            enum: [WAN_ACCESS_TYPE.DISABLED],
                        },
                    } as SchemaBasedCondition,
                },
            }),
            createLabeledControl({
                scope: '#/properties/remote-access/properties/port',
                label: 'Remote Access WAN Port',
                controlOptions: {
                    format: 'short',
                    formatOptions: {
                        useGrouping: false,
                    },
                },
                rule: {
                    effect: RuleEffect.DISABLE,
                    condition: {
                        scope: '#/properties/remote-access',
                        schema: {
                            anyOf: [
                                {
                                    properties: {
                                        accessType: {
                                            const: WAN_ACCESS_TYPE.DISABLED,
                                        },
                                    },
                                    required: ['accessType'],
                                },
                                {
                                    properties: {
                                        forwardType: {
                                            const: WAN_FORWARD_TYPE.UPNP,
                                        },
                                    },
                                    required: ['forwardType'],
                                },
                            ],
                        },
                    },
                },
            }),
        ];

        /** shape of the data associated with remote access settings, as json schema properties*/
        const properties: DataSlice = {
            accessType: {
                type: 'string',
                enum: [WAN_ACCESS_TYPE.DISABLED, WAN_ACCESS_TYPE.ALWAYS],
                title: 'Allow Remote Access',
                default: WAN_ACCESS_TYPE.DISABLED,
            },
            forwardType: {
                type: 'string',
                enum: Object.values(WAN_FORWARD_TYPE),
                title: 'Forward Type',
                default: WAN_FORWARD_TYPE.STATIC,
            },
            port: {
                // 'port' is null when remote access is disabled.
                type: ['number', 'null'],
                title: 'WAN Port',
                minimum: 0,
                maximum: 65535,
            },
        };

        return {
            properties,
            elements: precondition ? formControls : requirements,
        };
    }

    /**
     * Flash backup settings slice
     */
    flashBackupSlice(): SettingSlice {
        return {
            properties: {
                status: {
                    type: 'string',
                    enum: ['inactive', 'active', 'updating'],
                    default: 'inactive',
                },
            },
            elements: [], // No UI elements needed for this system-managed setting
        };
    }
}
