import { describe, expect, it } from 'vitest';

import { resolveConnectEnvironment } from '@app/environment.js';

describe('Connect environment paths', () => {
    it('uses the production Connect paths by default', () => {
        expect(
            resolveConnectEnvironment({}, false, '/boot/config/plugins/dynamix.my.servers/configs')
        ).toEqual({
            CONNECT_CONFIG_PATH: '/boot/config/plugins/dynamix.my.servers/configs/connect.json',
            CONNECT_LEGACY_PATH: '/boot/config/plugins/dynamix.my.servers/myservers.cfg',
            CONNECT_CERT_BUNDLE_PATH: '/boot/config/ssl/certs/certificate_bundle.pem',
            CONNECT_STATE_PATH: '/boot/config/plugins/dynamix.my.servers/configs/server-state-v1.json',
            CONNECT_CONTROL_PLANE_URL: 'https://nexus.unraid.net',
        });
    });

    it('isolates Connect state and certificates in preview mode', () => {
        expect(
            resolveConnectEnvironment({}, true, '/boot/config/plugins/dynamix.my.servers/configs')
        ).toEqual({
            CONNECT_CONFIG_PATH: '/boot/config/preview/plugins/dynamix.my.servers/configs/connect.json',
            CONNECT_LEGACY_PATH: '/boot/config/preview/plugins/dynamix.my.servers/myservers.cfg',
            CONNECT_CERT_BUNDLE_PATH: '/boot/config/preview/ssl/certs/certificate_bundle.pem',
            CONNECT_STATE_PATH:
                '/boot/config/preview/plugins/dynamix.my.servers/configs/server-state-v1.json',
            CONNECT_CONTROL_PLANE_URL: 'https://preview.nexus.unraid.net',
        });
    });

    it('keeps explicit Connect overrides in preview mode', () => {
        expect(
            resolveConnectEnvironment(
                {
                    UNRAID_CONNECT_CONFIG_PATH: '/test/connect.json',
                    UNRAID_CONNECT_LEGACY_PATH: '/test/myservers.cfg',
                    CONNECT_CERT_BUNDLE_PATH: '/test/certificate.pem',
                    CONNECT_STATE_PATH: '/test/state.json',
                    UNRAID_CONTROL_PLANE_URL: 'https://control.example.test',
                },
                true,
                '/unused'
            )
        ).toEqual({
            CONNECT_CONFIG_PATH: '/test/connect.json',
            CONNECT_LEGACY_PATH: '/test/myservers.cfg',
            CONNECT_CERT_BUNDLE_PATH: '/test/certificate.pem',
            CONNECT_STATE_PATH: '/test/state.json',
            CONNECT_CONTROL_PLANE_URL: 'https://control.example.test',
        });
    });
});
