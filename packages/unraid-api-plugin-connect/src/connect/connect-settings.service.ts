import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';

import type { SchemaBasedCondition } from '@jsonforms/core';
import type { DataSlice, SettingSlice, UIElement } from '@unraid/shared/jsonforms/settings.js';
import { RuleEffect } from '@jsonforms/core';
import { createLabeledControl } from '@unraid/shared/jsonforms/control.js';
import { mergeSettingSlices } from '@unraid/shared/jsonforms/settings.js';
import { csvStringToArray } from '@unraid/shared/util/data.js';
import { fileExistsSync } from '@unraid/shared/util/file.js';
import { execa } from 'execa';
import { GraphQLError } from 'graphql/error/GraphQLError.js';
import { decodeJwt } from 'jose';

import { EVENTS } from '../pubsub/consts.js';
import { ConnectApiKeyService } from './connect-api-key.service.js';
import { DynamicRemoteAccessService } from '../remote-access/dynamic-remote-access.service.js';
import { URL_TYPE } from '@unraid/shared/network.model.js';
import {
    DynamicRemoteAccessType,
    WAN_ACCESS_TYPE,
    WAN_FORWARD_TYPE,
} from './connect.model.js';
import { ConfigType, ConnectConfig, MyServersConfig } from '../config.entity.js';

import type {
    ApiSettingsInput,
    ConnectSettingsValues,
    ConnectSignInInput,
    EnableDynamicRemoteAccessInput,
    RemoteAccess,
    SetupRemoteAccessInput,
} from './connect.model.js';

@Injectable()
export class ConnectSettingsService {
    constructor(
        private readonly configService: ConfigService<ConfigType>,
        private readonly remoteAccess: DynamicRemoteAccessService,
        private readonly apiKeyService: ConnectApiKeyService,
        private readonly eventEmitter: EventEmitter2
    ) {}

    private readonly logger = new Logger(ConnectSettingsService.name);

    async restartApi() {
        try {
            await execa('unraid-api', ['restart'], { shell: 'bash', stdio: 'ignore' });
        } catch (error) {
            this.logger.error(error);
        }
    }

    public async extraAllowedOrigins(): Promise<Array<string>> {
        const extraOrigins = this.configService.get('store.config.api.extraOrigins');
        if (!extraOrigins) return [];
        return csvStringToArray(extraOrigins).filter(
            (origin) => origin.startsWith('http://') || origin.startsWith('https://')
        );
    }

    isConnectPluginInstalled(): boolean {
        return ['/var/lib/pkgtools/packages/dynamix.unraid.net', '/usr/local/bin/unraid-api'].some(
            (path) => fileExistsSync(path)
        );
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
        const { certificateName } = this.configService.getOrThrow('store.emhttp.nginx');
        return certificateName.endsWith('.myunraid.net');
    }

    /**------------------------------------------------------------------------
     *                           Settings Form Data
     *------------------------------------------------------------------------**/

    async getCurrentSettings(): Promise<ConnectSettingsValues> {
        const connect = this.configService.getOrThrow<ConnectConfig>('connect');
        return {
            ...(await this.dynamicRemoteAccessSettings()),
            sandbox: this.configService.get('store.config.local.sandbox') === 'yes',
            extraOrigins: await this.extraAllowedOrigins(),
            ssoUserIds: connect.config.ssoSubIds,
        };
    }

    /**
     * Syncs the settings to the store and writes the config to disk
     * @param settings - The settings to sync
     * @returns true if a restart is required, false otherwise
     */
    async syncSettings(settings: Partial<ApiSettingsInput>): Promise<boolean> {
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
        if (settings.extraOrigins) {
            await this.updateAllowedOrigins(settings.extraOrigins);
        }
        if (typeof settings.sandbox === 'boolean') {
            restartRequired ||= await this.setSandboxMode(settings.sandbox);
        }
        if (settings.ssoUserIds) {
            restartRequired ||= await this.updateSSOUsers(settings.ssoUserIds);
        }
        // const { writeConfigSync } = await import('@app/store/sync/config-disk-sync.js');
        // writeConfigSync('flash');
        return restartRequired;
    }

    private async updateAllowedOrigins(origins: string[]) {
        this.configService.set('store.config.api.extraOrigins', origins.join(','));
    }

    private async getOrCreateLocalApiKey() {
        const { localApiKey: localApiKeyFromConfig } = this.configService.getOrThrow<MyServersConfig>('connect.config');
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
        const status = this.configService.get('store.emhttp.status');
        if (status === "LOADED") {
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

                // Update config with user info
                this.configService.set('connect.config.avatar', typeof userInfo.avatar === 'string' ? userInfo.avatar : '');
                this.configService.set('connect.config.username', userInfo.preferred_username);
                this.configService.set('connect.config.email', userInfo.email);
                this.configService.set('connect.config.apikey', input.apiKey);
                this.configService.set('connect.config.localApiKey', localApiKey);

                // Emit login event
                this.eventEmitter.emit(EVENTS.LOGIN, {
                    username: userInfo.preferred_username,
                    avatar: typeof userInfo.avatar === 'string' ? userInfo.avatar : '',
                    email: userInfo.email,
                    apikey: input.apiKey,
                    localApiKey,
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

    /**
     * Sets the sandbox mode and returns true if the mode was changed
     * @param sandboxEnabled - Whether to enable sandbox mode
     * @returns true if the mode was changed, false otherwise
     */
    private async setSandboxMode(sandboxEnabled: boolean): Promise<boolean> {
        throw new Error('Not implemented');
        const currentSandbox = this.configService.get('store.config.local.sandbox');
        const sandbox = sandboxEnabled ? 'yes' : 'no';
        if (currentSandbox === sandbox) return false;
        this.configService.set('store.config.local.sandbox', sandbox);
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
        this.configService.set('connect.config.ssoSubIds', userIds);
        // request a restart if we're there were no sso users before
        return currentUserSet.size === 0;
    }

    private getDynamicRemoteAccessType(
        accessType: WAN_ACCESS_TYPE,
        forwardType?: WAN_FORWARD_TYPE | undefined | null
    ): DynamicRemoteAccessType {
        // If access is disabled or always, DRA is disabled
        if (accessType === WAN_ACCESS_TYPE.DISABLED || accessType === WAN_ACCESS_TYPE.ALWAYS) {
            return DynamicRemoteAccessType.DISABLED;
        }
        // if access is enabled and forward type is UPNP, DRA is UPNP, otherwise it is static
        return forwardType === WAN_FORWARD_TYPE.UPNP
            ? DynamicRemoteAccessType.UPNP
            : DynamicRemoteAccessType.STATIC;
    }

    private async updateRemoteAccess(input: SetupRemoteAccessInput): Promise<boolean> {
        const dynamicRemoteAccessType = this.getDynamicRemoteAccessType(input.accessType, input.forwardType);
        
        this.configService.set('connect.config.wanaccess', input.accessType === WAN_ACCESS_TYPE.ALWAYS);
        this.configService.set('connect.config.wanport', input.forwardType === WAN_FORWARD_TYPE.STATIC ? input.port : null);
        this.configService.set('connect.config.upnpEnabled', input.forwardType === WAN_FORWARD_TYPE.UPNP);
        
        // Use the dynamic remote access service to handle the transition
        await this.remoteAccess.enableDynamicRemoteAccess({
            type: dynamicRemoteAccessType,
            allowedUrl: {
                ipv4: null,
                ipv6: null,
                type: URL_TYPE.WAN,
                name: null
            }
        });
        
        return true;
    }

    public async dynamicRemoteAccessSettings(): Promise<RemoteAccess> {
        const config = this.configService.getOrThrow<MyServersConfig>('connect.config');
        return {
            accessType: config.wanaccess
                ? config.dynamicRemoteAccessType !== DynamicRemoteAccessType.DISABLED
                    ? WAN_ACCESS_TYPE.DYNAMIC
                    : WAN_ACCESS_TYPE.ALWAYS
                : WAN_ACCESS_TYPE.DISABLED,
            forwardType: config.upnpEnabled ? WAN_FORWARD_TYPE.UPNP : WAN_FORWARD_TYPE.STATIC,
            port: config.wanport ? Number(config.wanport) : null,
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
            createLabeledControl({
                scope: '#/properties/accessType',
                label: 'Allow Remote Access',
                controlOptions: {},
            }),
            createLabeledControl({
                scope: '#/properties/forwardType',
                label: 'Remote Access Forward Type',
                controlOptions: {},
                rule: {
                    effect: RuleEffect.DISABLE,
                    condition: {
                        scope: '#/properties/accessType',
                        schema: {
                            enum: [WAN_ACCESS_TYPE.DISABLED],
                        },
                    } as SchemaBasedCondition,
                },
            }),
            createLabeledControl({
                scope: '#/properties/port',
                label: 'Remote Access WAN Port',
                controlOptions: {
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
            }),
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
