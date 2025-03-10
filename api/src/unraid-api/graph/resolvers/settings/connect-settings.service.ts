import { Injectable } from '@nestjs/common';

import type {
    Categorization,
    ControlElement,
    JsonSchema,
    LabelElement,
    Layout,
    SchemaBasedCondition,
    UISchemaElement,
} from '@jsonforms/core';
import { RuleEffect } from '@jsonforms/core';

import { fileExistsSync } from '@app/core/utils/files/file-exists.js';

type DataSlice = Record<string, JsonSchema>;
type UIElement = UISchemaElement | LabelElement | Layout | ControlElement | Categorization;
type SettingSlice = {
    /** One or more JSON schema properties */
    properties: DataSlice;
    /** One or more UI schema elements */
    elements: UIElement[];
};

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

    /**
     * Builds the complete settings schema
     */
    async buildSettingsSchema(): Promise<SettingSlice> {
        const slices = [
            await this.remoteAccessSlice(),
            this.sandboxSlice(),
            this.flashBackupSlice(),
            this.extraOriginsSlice(),
        ];

        return this.reduceSlices(slices);
    }

    /**------------------------------------------------------------------------
     *                           Settings Form Slices
     *------------------------------------------------------------------------**/

    createEmptySlice(): SettingSlice {
        return { properties: {}, elements: [] };
    }

    /**
     * Computes the JSONForms schema definition for remote access settings.
     */
    async remoteAccessSlice(scope = '#/properties/remoteAccess'): Promise<SettingSlice> {
        // const precondition = (await this.isSignedIn()) && (await this.isSSLCertProvisioned());
        const precondition = true;
        // if (!precondition) return this.createEmptySlice();

        const { getters } = await import('@app/store/index.js');
        const { nginx } = getters.emhttp();
        return {
            properties: {
                remoteAccess: {
                    type: 'string',
                    enum: [
                        'OFF',
                        'DYNAMIC_UPNP',
                        nginx.sslEnabled && 'DYNAMIC_MANUAL',
                        'ALWAYS_UPNP',
                        'ALWAYS_MANUAL',
                    ].filter((val) => Boolean(val)),
                    title: 'Allow Remote Access',
                    default: 'OFF',
                },
                wanPort: {
                    type: 'number',
                    title: 'WAN Port',
                    minimum: 0,
                    maximum: 65535,
                },
            },
            elements: precondition
                ? [
                      {
                          type: 'Control',
                          scope,
                          label: 'Allow Remote Access',
                      },
                      {
                          type: 'Control',
                          scope: '#/properties/wanPort',
                          label: 'Remote Access WAN Port',
                          options: {
                              format: 'short',
                          },
                          rule: {
                              effect: RuleEffect.ENABLE,
                              // technically, this is a SchemaBasedCondition, but that type requires a scope
                              // but this has been working and I don't know what the correct scope would be.
                              condition: {
                                  failWhenUndefined: true,
                                  scope,
                                  schema: {
                                      enum: ['DYNAMIC_MANUAL', 'ALWAYS_MANUAL'],
                                  },
                              } as Omit<SchemaBasedCondition, 'scope'>,
                          },
                      },
                  ]
                : [
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
                  ],
        };
    }

    /**
     * Developer sandbox settings slice
     */
    sandboxSlice(): SettingSlice {
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
     * Reduces multiple setting slices into a single slice
     */
    private reduceSlices(slices: SettingSlice[]): SettingSlice {
        const result = this.createEmptySlice();
        for (const slice of slices) {
            Object.assign(result.properties, slice.properties);
            result.elements.push(...slice.elements);
        }
        return result;
    }
}
