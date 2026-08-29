import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';

import type { JsonSchema7, SchemaBasedCondition } from '@jsonforms/core';
import type { DataSlice, SettingSlice, UIElement } from '@unraid/shared/jsonforms/settings.js';
import { RuleEffect } from '@jsonforms/core';
import { createLabeledControl } from '@unraid/shared/jsonforms/control.js';

import { ConnectConfigPersister } from '../config/config.persistence.js';
import {
    DynamicRemoteAccessType,
    makeDisabledDynamicRemoteAccessState,
} from '../config/connect.config.js';
import { EVENTS } from '../helper/nest-tokens.js';
import { NetworkService } from '../network/network.service.js';
import { UpnpService } from '../network/upnp.service.js';
import { RemoteAccess, WAN_ACCESS_TYPE, WAN_FORWARD_TYPE } from '../unraid-connect/connect.model.js';

@Injectable()
export class RemoteAccessService {
    private queue: Promise<unknown> = Promise.resolve();
    constructor(
        private readonly config: ConfigService,
        private readonly persistence: ConnectConfigPersister,
        private readonly upnp: UpnpService,
        @Inject(NetworkService) private readonly network: Pick<NetworkService, 'reloadNetworkStack'>
    ) {}

    settings(): RemoteAccess {
        const config = this.persistence.getConfig();
        return {
            accessType: config.wanaccess ? WAN_ACCESS_TYPE.ALWAYS : WAN_ACCESS_TYPE.DISABLED,
            forwardType: config.upnpEnabled ? WAN_FORWARD_TYPE.UPNP : WAN_FORWARD_TYPE.STATIC,
            port: config.wanport || null,
        };
    }
    private serial(work: () => Promise<void>): Promise<void> {
        const result = this.queue.catch(() => undefined).then(work);
        this.queue = result;
        return result;
    }
    async isSignedIn() {
        return Boolean(this.persistence.getConfig().apikey);
    }
    async isSSLCertProvisioned() {
        return (this.config.get<string>('store.emhttp.nginx.certificateName') ?? '').endsWith(
            '.myunraid.net'
        );
    }
    @OnEvent('app.ready')
    @OnEvent(EVENTS.IDENTITY_CHANGED)
    async reload(): Promise<void> {
        await this.serial(() => this.apply());
    }

    async update(input: Partial<RemoteAccess>): Promise<void> {
        await this.serial(async () => {
            const current = this.settings();
            const desired = { ...current, ...input };
            if (
                desired.accessType === current.accessType &&
                desired.forwardType === current.forwardType &&
                desired.port === current.port
            )
                return;
            if (![WAN_ACCESS_TYPE.ALWAYS, WAN_ACCESS_TYPE.DISABLED].includes(desired.accessType)) {
                throw new Error('Use tunnel access for on-demand remote connections');
            }
            if (![WAN_FORWARD_TYPE.STATIC, WAN_FORWARD_TYPE.UPNP].includes(desired.forwardType!)) {
                throw new Error('Choose manual port forwarding or UPnP');
            }
            const enabled = desired.accessType === WAN_ACCESS_TYPE.ALWAYS;
            if (
                enabled &&
                (!(await this.isSignedIn()) ||
                    !(await this.isSSLCertProvisioned()) ||
                    !this.config.get('store.emhttp.nginx.sslEnabled'))
            ) {
                throw new Error(
                    'Direct remote access requires sign-in and a provisioned HTTPS certificate'
                );
            }
            if (
                enabled &&
                desired.forwardType === WAN_FORWARD_TYPE.STATIC &&
                (!Number.isInteger(desired.port) ||
                    !desired.port ||
                    desired.port < 1 ||
                    desired.port > 65535)
            ) {
                throw new Error('Manual forwarding requires a WAN port from 1 to 65535');
            }
            const previous = this.settings();
            if (this.upnp.enabled) await this.upnp.disableUpnp();
            await this.persistence.update({
                wanaccess: enabled,
                upnpEnabled: enabled && desired.forwardType === WAN_FORWARD_TYPE.UPNP,
                wanport: !enabled
                    ? null
                    : desired.forwardType === WAN_FORWARD_TYPE.STATIC
                      ? desired.port
                      : previous.forwardType === WAN_FORWARD_TYPE.UPNP
                        ? previous.port
                        : null,
                dynamicRemoteAccessType: !enabled
                    ? DynamicRemoteAccessType.DISABLED
                    : desired.forwardType === WAN_FORWARD_TYPE.UPNP
                      ? DynamicRemoteAccessType.UPNP
                      : DynamicRemoteAccessType.STATIC,
            });
            try {
                await this.apply(true);
            } catch (error) {
                await this.persistence.update({
                    wanaccess: false,
                    upnpEnabled: false,
                    dynamicRemoteAccessType: DynamicRemoteAccessType.DISABLED,
                });
                await this.upnp.disableUpnp();
                this.setRunning(DynamicRemoteAccessType.DISABLED);
                await this.network.reloadNetworkStack().catch(() => undefined);
                throw error;
            }
        });
    }
    private async apply(forceReload = false): Promise<void> {
        const config = this.persistence.getConfig();
        const enabled = Boolean(config.apikey && config.wanaccess);
        if (!enabled || !config.upnpEnabled) {
            if (this.upnp.enabled) await this.upnp.disableUpnp();
        } else {
            const localPort = this.config.get<number>('store.emhttp.nginx.httpsPort');
            if (!Number.isInteger(localPort) || !localPort || localPort < 1 || localPort > 65535)
                throw new Error('HTTPS port unavailable');
            const mapping = await this.upnp.createOrRenewUpnpLease({
                localPort,
                wanPort: config.wanport || undefined,
            });
            await this.persistence.update({ wanport: mapping.publicPort });
        }
        this.setRunning(
            !enabled
                ? DynamicRemoteAccessType.DISABLED
                : config.upnpEnabled
                  ? DynamicRemoteAccessType.UPNP
                  : DynamicRemoteAccessType.STATIC
        );
        if (forceReload || config.wanaccess || this.config.get('store.emhttp.nginx.wanAccessEnabled'))
            await this.network.reloadNetworkStack();
    }
    private setRunning(type: DynamicRemoteAccessType) {
        this.config.set('connect.dynamicRemoteAccess', {
            ...makeDisabledDynamicRemoteAccessState(),
            runningType: type,
        });
    }

    async buildSlice(): Promise<SettingSlice> {
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

    async remoteAccessSlice(): Promise<SettingSlice> {
        const isSignedIn = await this.isSignedIn();
        const isSSLCertProvisioned = await this.isSSLCertProvisioned();
        const { sslEnabled } = this.config.get('store.emhttp.nginx', { sslEnabled: false });
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
}
