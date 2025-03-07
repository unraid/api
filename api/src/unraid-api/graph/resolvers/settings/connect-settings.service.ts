import { Injectable } from '@nestjs/common';

import type {
    Categorization,
    ControlElement,
    JsonSchema,
    LabelElement,
    Layout,
    UISchemaElement,
} from '@jsonforms/core';

import { fileExistsSync } from '@app/core/utils/files/file-exists.js';

type DataSlice = NonNullable<JsonSchema['properties']>;
type UIElement = UISchemaElement | LabelElement | Layout | ControlElement | Categorization;
type SettingSlice = {
    /** One or more JSON schema properties */
    dataSlice: DataSlice;
    /** One or more UI schema elements */
    uiSlice: UIElement[];
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

    /**------------------------------------------------------------------------
     *                           Settings Form Slices
     *------------------------------------------------------------------------**/

    /**
     * Computes the JSONForms schema definition for remote access settings.
     * This function first checks if the user is signed in and if an SSL certificate has been provisioned.
     * If either check fails, it returns an empty object. Otherwise, it returns a JSONForms schema object
     * that defines the allowed remote access options based on the current SSL configuration.
     *
     * @returns An object containing JSONForms schema slices describing remote access settings and a UI schema object.
     */
    async remoteAccessDataSchema(scope = '#/properties/remoteAccess'): Promise<SettingSlice> {
        const slice: SettingSlice = { dataSlice: {}, uiSlice: [] };
        if (!(await this.isSignedIn())) return slice;
        if (!(await this.isSSLCertProvisioned())) return slice;

        const { getters } = await import('@app/store/index.js');
        const { nginx } = getters.emhttp();
        // one or more json schema properties
        slice.dataSlice = {
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
        };
        // one or more ui schema elements
        slice.uiSlice = [
            {
                type: 'Control',
                scope,
                label: 'Allow Remote Access',
            },
        ];
        return slice;
    }
}
