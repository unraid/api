import { Injectable } from '@nestjs/common';

import { fileExistsSync } from '@app/core/utils/files/file-exists.js';

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
     * Computes the JSON schema definition for remote access settings.
     * This function first checks if the user is signed in and if an SSL certificate has been provisioned.
     * If either check fails, it returns an empty object. Otherwise, it returns a JSON schema object
     * that defines the allowed remote access options based on the current SSL configuration.
     *
     * @returns A JSON schema object describing remote access settings.
     */
    async remoteAccessDataSchema() {
        if (!(await this.isSignedIn())) return {};
        if (!(await this.isSSLCertProvisioned())) return {};
        const { getters } = await import('@app/store/index.js');
        const { nginx } = getters.emhttp();
        return {
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
        } as const;
    }

    /**
     * Provides the UI schema configuration for the remote access form control.
     *
     * @param scope - A JSON pointer to the schema property; defaults to "#/properties/remoteAccess".
     * @returns A UI schema definition for rendering the remote access control.
     */
    async remoteAccessUiSchema(scope = '#/properties/remoteAccess') {
        return {
            type: 'Control',
            scope,
            label: 'Allow Remote Access',
        } as const;
    }
}
