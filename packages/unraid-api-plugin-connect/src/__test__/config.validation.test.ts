import { ConfigService } from '@nestjs/config';

import { describe, expect, it } from 'vitest';

import { ConnectConfigPersister } from '../config/config.persistence.js';

const persister = new ConnectConfigPersister(
    new ConfigService({ CONNECT_CERT_BUNDLE_PATH: '/missing/test-certificate.pem' })
);

describe('Connect configuration validation', () => {
    it.each(['user@example.com', '', null, undefined])(
        'accepts a valid or absent email: %s',
        async (email) => {
            expect((await persister.validate({ email })).email).toBe(email);
        }
    );
    it.each(['invalid-email', '@example.com'])('rejects malformed identity: %s', async (email) => {
        await expect(persister.validate({ email })).rejects.toThrow();
    });
    it.each(['certificateManagementEnabled', 'serverDataReportingEnabled', 'serverDataRemoteCleared'])(
        'rejects non-boolean %s',
        async (key) => {
            await expect(persister.validate({ [key]: 'yes' })).rejects.toThrow();
        }
    );
    it('rejects non-boolean tunnel settings even when certificate management is off', async () => {
        await expect(persister.validate({ tunnelRemoteAccessEnabled: 'yes' })).rejects.toThrow();
    });
    it('requires certificate management for persisted remote access', async () => {
        expect(
            (
                await persister.validate({
                    certificateManagementEnabled: false,
                    tunnelRemoteAccessEnabled: true,
                })
            ).tunnelRemoteAccessEnabled
        ).toBe(false);
    });
    it('discards unsupported fields and preserves direct forwarding', async () => {
        const value = await persister.validate({
            arbitrary: true,
            wanaccess: true,
            upnpEnabled: true,
            wanport: 8080,
            dynamicRemoteAccessType: 'STATIC',
        });
        expect(value).not.toHaveProperty('arbitrary');
        expect(value).toMatchObject({
            wanaccess: true,
            upnpEnabled: true,
            wanport: 8080,
            dynamicRemoteAccessType: 'STATIC',
        });
    });
    it.each(['apikey', 'localApiKey', 'username', 'avatar', 'regWizTime'])(
        'rejects invalid %s',
        async (key) => {
            await expect(persister.validate({ [key]: 123 })).rejects.toThrow();
        }
    );
});
