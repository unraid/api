import { ConfigService } from '@nestjs/config';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { faker } from '@faker-js/faker';
import * as fc from 'fast-check';

import { ConfigType, DynamicRemoteAccessType } from '../model/connect-config.model.js';
import { ConnectConfigPersister } from '../service/config.persistence.js';

describe('ConnectConfigPersister', () => {
    let service: ConnectConfigPersister;
    let configService: ConfigService<ConfigType, true>;

    beforeEach(() => {
        configService = {
            getOrThrow: vi.fn(),
            get: vi.fn(),
            set: vi.fn(),
            changes$: {
                pipe: vi.fn(() => ({
                    subscribe: vi.fn(),
                })),
            },
        } as any;

        service = new ConnectConfigPersister(configService as any);
    });

    describe('parseLegacyConfig', () => {
        it('should parse INI format legacy config correctly', () => {
            const iniContent = `
[api]
version="4.8.0+9485809"
extraOrigins="https://example1.com,https://example2.com"
[local]
sandbox="no"
[remote]
wanaccess="yes"
wanport="3333"
upnpEnabled="no"
apikey="unraid_test_key"
localApiKey="test_local_key"
email="test@example.com"
username="testuser"
avatar=""
regWizTime=""
accesstoken=""
idtoken=""
refreshtoken=""
dynamicRemoteAccessType="DISABLED"
ssoSubIds="user1,user2"
            `.trim();

            const result = service.parseLegacyConfig(iniContent);

            expect(result.api.version).toBe('4.8.0+9485809');
            expect(result.api.extraOrigins).toBe('https://example1.com,https://example2.com');
            expect(result.local.sandbox).toBe('no');
            expect(result.remote.wanaccess).toBe('yes');
            expect(result.remote.wanport).toBe('3333');
            expect(result.remote.upnpEnabled).toBe('no');
            expect(result.remote.ssoSubIds).toBe('user1,user2');
        });

        it('should parse various INI configs with different boolean values using fast-check', () => {
            fc.assert(
                fc.property(
                    fc.boolean(),
                    fc.boolean(),
                    fc.constantFrom('yes', 'no'),
                    fc.integer({ min: 1000, max: 9999 }),
                    fc.constant(null).map(() => faker.internet.email()),
                    fc.constant(null).map(() => faker.internet.username()),
                    (wanaccess, upnpEnabled, sandbox, port, email, username) => {
                        const iniContent = `
[api]
version="6.12.0"
extraOrigins=""
[local]
sandbox="${sandbox}"
[remote]
wanaccess="${wanaccess ? 'yes' : 'no'}"
wanport="${port}"
upnpEnabled="${upnpEnabled ? 'yes' : 'no'}"
apikey="unraid_test_key"
localApiKey="test_local_key"
email="${email}"
username="${username}"
avatar=""
regWizTime=""
accesstoken=""
idtoken=""
refreshtoken=""
dynamicRemoteAccessType="DISABLED"
ssoSubIds=""
                        `.trim();

                        const result = service.parseLegacyConfig(iniContent);

                        expect(result.api.version).toBe('6.12.0');
                        expect(result.local.sandbox).toBe(sandbox);
                        expect(result.remote.wanaccess).toBe(wanaccess ? 'yes' : 'no');
                        expect(result.remote.wanport).toBe(port.toString());
                        expect(result.remote.upnpEnabled).toBe(upnpEnabled ? 'yes' : 'no');
                        expect(result.remote.email).toBe(email);
                        expect(result.remote.username).toBe(username);
                    }
                ),
                { numRuns: 25 }
            );
        });

        it('should handle empty sections gracefully', () => {
            const iniContent = `
[api]
version="6.12.0"
[local]
[remote]
wanaccess="no"
wanport="0"
upnpEnabled="no"
apikey="test"
localApiKey="test"
email="test@example.com"
username="test"
avatar=""
regWizTime=""
dynamicRemoteAccessType="DISABLED"
            `.trim();

            const result = service.parseLegacyConfig(iniContent);

            expect(result.api.version).toBe('6.12.0');
            expect(result.local).toBeDefined();
            expect(result.remote).toBeDefined();
            expect(result.remote.wanaccess).toBe('no');
        });
    });

    describe('convertLegacyConfig', () => {
        it('should migrate wanaccess from string "yes" to boolean true', async () => {
            const legacyConfig = {
                api: { version: '4.8.0+9485809', extraOrigins: '' },
                local: { sandbox: 'no' },
                remote: {
                    wanaccess: 'yes',
                    wanport: '3333',
                    upnpEnabled: 'no',
                    apikey: 'unraid_test_key',
                    localApiKey: 'test_local_key',
                    email: 'test@example.com',
                    username: 'testuser',
                    avatar: '',
                    regWizTime: '',
                    accesstoken: '',
                    idtoken: '',
                    refreshtoken: '',
                    dynamicRemoteAccessType: 'DISABLED',
                    ssoSubIds: '',
                },
            } as any;

            const result = await service.convertLegacyConfig(legacyConfig);

            expect(result.wanaccess).toBe(true);
        });

        it('should migrate wanaccess from string "no" to boolean false', async () => {
            const legacyConfig = {
                api: { version: '4.8.0+9485809', extraOrigins: '' },
                local: { sandbox: 'no' },
                remote: {
                    wanaccess: 'no',
                    wanport: '3333',
                    upnpEnabled: 'no',
                    apikey: 'unraid_test_key',
                    localApiKey: 'test_local_key',
                    email: 'test@example.com',
                    username: 'testuser',
                    avatar: '',
                    regWizTime: '',
                    accesstoken: '',
                    idtoken: '',
                    refreshtoken: '',
                    dynamicRemoteAccessType: 'DISABLED',
                    ssoSubIds: '',
                },
            } as any;

            const result = await service.convertLegacyConfig(legacyConfig);

            expect(result.wanaccess).toBe(false);
        });

        it('should migrate wanport from string to number', async () => {
            const legacyConfig = {
                api: { version: '4.8.0+9485809', extraOrigins: '' },
                local: { sandbox: 'no' },
                remote: {
                    wanaccess: 'yes',
                    wanport: '8080',
                    upnpEnabled: 'no',
                    apikey: 'unraid_test_key',
                    localApiKey: 'test_local_key',
                    email: 'test@example.com',
                    username: 'testuser',
                    avatar: '',
                    regWizTime: '',
                    accesstoken: '',
                    idtoken: '',
                    refreshtoken: '',
                    dynamicRemoteAccessType: 'DISABLED',
                    ssoSubIds: '',
                },
            } as any;

            const result = await service.convertLegacyConfig(legacyConfig);

            expect(result.wanport).toBe(8080);
            expect(typeof result.wanport).toBe('number');
        });

        it('should migrate upnpEnabled from string "yes" to boolean true', async () => {
            const legacyConfig = {
                api: { version: '4.8.0+9485809', extraOrigins: '' },
                local: { sandbox: 'no' },
                remote: {
                    wanaccess: 'yes',
                    wanport: '3333',
                    upnpEnabled: 'yes',
                    apikey: 'unraid_test_key',
                    localApiKey: 'test_local_key',
                    email: 'test@example.com',
                    username: 'testuser',
                    avatar: '',
                    regWizTime: '',
                    accesstoken: '',
                    idtoken: '',
                    refreshtoken: '',
                    dynamicRemoteAccessType: 'DISABLED',
                    ssoSubIds: '',
                },
            } as any;

            const result = await service.convertLegacyConfig(legacyConfig);

            expect(result.upnpEnabled).toBe(true);
        });

        it('should migrate upnpEnabled from string "no" to boolean false', async () => {
            const legacyConfig = {
                api: { version: '4.8.0+9485809', extraOrigins: '' },
                local: { sandbox: 'no' },
                remote: {
                    wanaccess: 'yes',
                    wanport: '3333',
                    upnpEnabled: 'no',
                    apikey: 'unraid_test_key',
                    localApiKey: 'test_local_key',
                    email: 'test@example.com',
                    username: 'testuser',
                    avatar: '',
                    regWizTime: '',
                    accesstoken: '',
                    idtoken: '',
                    refreshtoken: '',
                    dynamicRemoteAccessType: 'DISABLED',
                    ssoSubIds: '',
                },
            } as any;

            const result = await service.convertLegacyConfig(legacyConfig);

            expect(result.upnpEnabled).toBe(false);
        });

        it('should migrate signed in user information correctly', async () => {
            const legacyConfig = {
                api: { version: '4.8.0+9485809', extraOrigins: '' },
                local: { sandbox: 'no' },
                remote: {
                    wanaccess: 'yes',
                    wanport: '3333',
                    upnpEnabled: 'no',
                    apikey: 'unraid_sfHboeSNzTzx24816QBssqi0A3nIT0f4Xg4c9Ht49WQfQKLMojU81Sb3f',
                    localApiKey: '101d204832d24fc7e5d387f6fce47067ba230f8aa0ac3bcc6c12a415aa27dbd9',
                    email: 'pujitm2009@gmail.com',
                    username: 'pujitm2009@gmail.com',
                    avatar: '',
                    regWizTime: '',
                    accesstoken: '',
                    idtoken: '',
                    refreshtoken: '',
                    dynamicRemoteAccessType: 'DISABLED',
                    ssoSubIds: '',
                },
            } as any;

            const result = await service.convertLegacyConfig(legacyConfig);

            expect(result.apikey).toBe(
                'unraid_sfHboeSNzTzx24816QBssqi0A3nIT0f4Xg4c9Ht49WQfQKLMojU81Sb3f'
            );
            expect(result.localApiKey).toBe(
                '101d204832d24fc7e5d387f6fce47067ba230f8aa0ac3bcc6c12a415aa27dbd9'
            );
            expect(result.email).toBe('pujitm2009@gmail.com');
            expect(result.username).toBe('pujitm2009@gmail.com');
            expect(result.avatar).toBe('');
        });

        it('should merge all sections (api, local, remote) into single config object', async () => {
            const legacyConfig = {
                api: { version: '4.8.0+9485809', extraOrigins: 'https://example.com' },
                local: { sandbox: 'yes' },
                remote: {
                    wanaccess: 'yes',
                    wanport: '8080',
                    upnpEnabled: 'yes',
                    apikey: 'test_api_key',
                    localApiKey: 'test_local_key',
                    email: 'user@test.com',
                    username: 'testuser',
                    avatar: 'https://avatar.url',
                    regWizTime: '2023-01-01T00:00:00Z',
                    accesstoken: 'access_token_value',
                    idtoken: 'id_token_value',
                    refreshtoken: 'refresh_token_value',
                    dynamicRemoteAccessType: 'UPNP',
                    ssoSubIds: 'sub1,sub2',
                },
            } as any;

            const result = await service.convertLegacyConfig(legacyConfig);

            expect(result.wanaccess).toBe(true);
            expect(result.wanport).toBe(8080);
            expect(result.upnpEnabled).toBe(true);
            expect(result.apikey).toBe('test_api_key');
            expect(result.localApiKey).toBe('test_local_key');
            expect(result.email).toBe('user@test.com');
            expect(result.username).toBe('testuser');
            expect(result.avatar).toBe('https://avatar.url');
            expect(result.regWizTime).toBe('2023-01-01T00:00:00Z');
            expect(result.dynamicRemoteAccessType).toBe('UPNP');
        });

        it('should handle integration of parsing and conversion together', async () => {
            const iniContent = `
[api]
version="4.8.0+9485809"
extraOrigins="https://example.com"
[local]
sandbox="yes"
[remote]
wanaccess="yes"
wanport="8080"
upnpEnabled="yes"
apikey="test_api_key"
localApiKey="test_local_key"
email="user@test.com"
username="testuser"
avatar="https://avatar.url"
regWizTime="2023-01-01T00:00:00Z"
accesstoken="access_token_value"
idtoken="id_token_value"
refreshtoken="refresh_token_value"
dynamicRemoteAccessType="UPNP"
ssoSubIds="sub1,sub2"
            `.trim();

            // Parse the INI content
            const legacyConfig = service.parseLegacyConfig(iniContent);

            // Convert to new format
            const result = await service.convertLegacyConfig(legacyConfig);

            // Verify the end-to-end conversion
            expect(result.wanaccess).toBe(true);
            expect(result.wanport).toBe(8080);
            expect(result.upnpEnabled).toBe(true);
        });

        it('should handle various boolean migrations consistently using property-based testing', () => {
            fc.assert(
                fc.asyncProperty(
                    fc.boolean(),
                    fc.boolean(),
                    fc.integer({ min: 1000, max: 65535 }),
                    fc.constant(null).map(() => faker.internet.email()),
                    fc.constant(null).map(() => faker.internet.username()),
                    fc.constant(null).map(() => faker.string.alphanumeric({ length: 32 })),
                    async (wanaccess, upnpEnabled, port, email, username, apikey) => {
                        const legacyConfig = {
                            api: { version: faker.system.semver(), extraOrigins: '' },
                            local: { sandbox: 'no' },
                            remote: {
                                wanaccess: wanaccess ? 'yes' : 'no',
                                wanport: port.toString(),
                                upnpEnabled: upnpEnabled ? 'yes' : 'no',
                                apikey: `unraid_${apikey}`,
                                localApiKey: faker.string.alphanumeric({ length: 64 }),
                                email,
                                username,
                                avatar: faker.image.avatarGitHub(),
                                regWizTime: faker.date.past().toISOString(),
                                accesstoken: faker.string.alphanumeric({ length: 64 }),
                                idtoken: faker.string.alphanumeric({ length: 64 }),
                                refreshtoken: faker.string.alphanumeric({ length: 64 }),
                                dynamicRemoteAccessType: 'DISABLED',
                                ssoSubIds: '',
                            },
                        } as any;

                        const result = await service.convertLegacyConfig(legacyConfig);

                        // Test migration logic, not validation
                        expect(result.wanaccess).toBe(wanaccess);
                        expect(result.upnpEnabled).toBe(upnpEnabled);
                        expect(result.wanport).toBe(port);
                        expect(typeof result.wanport).toBe('number');
                        expect(result.email).toBe(email);
                        expect(result.username).toBe(username);
                        expect(result.apikey).toBe(`unraid_${apikey}`);
                    }
                ),
                { numRuns: 20 }
            );
        });

        it('should handle edge cases in port conversion', () => {
            fc.assert(
                fc.asyncProperty(
                    fc.integer({ min: 0, max: 65535 }),
                    async (port) => {
                        const legacyConfig = {
                            api: { version: '6.12.0', extraOrigins: '' },
                            local: { sandbox: 'no' },
                            remote: {
                                wanaccess: 'no',
                                wanport: port.toString(),
                                upnpEnabled: 'no',
                                apikey: 'unraid_test',
                                localApiKey: 'test_local',
                                email: 'test@example.com',
                                username: faker.internet.username(),
                                avatar: '',
                                regWizTime: '',
                                accesstoken: '',
                                idtoken: '',
                                refreshtoken: '',
                                dynamicRemoteAccessType: 'DISABLED',
                                ssoSubIds: '',
                            },
                        } as any;

                        const result = await service.convertLegacyConfig(legacyConfig);

                        // Test port conversion logic
                        expect(result.wanport).toBe(port);
                        expect(typeof result.wanport).toBe('number');
                    }
                ),
                { numRuns: 15 }
            );
        });

        it('should handle empty port values', async () => {
            const legacyConfig = {
                api: { version: '6.12.0', extraOrigins: '' },
                local: { sandbox: 'no' },
                remote: {
                    wanaccess: 'no',
                    wanport: '',
                    upnpEnabled: 'no',
                    apikey: 'unraid_test',
                    localApiKey: 'test_local',
                    email: 'test@example.com',
                    username: 'testuser',
                    avatar: '',
                    regWizTime: '',
                    accesstoken: '',
                    idtoken: '',
                    refreshtoken: '',
                    dynamicRemoteAccessType: 'DISABLED',
                    ssoSubIds: '',
                },
            } as any;

            const result = await service.convertLegacyConfig(legacyConfig);

            expect(result.wanport).toBe(0);
            expect(typeof result.wanport).toBe('number');
        });

        it('should reject invalid configurations during migration', async () => {
            const legacyConfig = {
                api: { version: '4.8.0+9485809', extraOrigins: '' },
                local: { sandbox: 'no' },
                remote: {
                    wanaccess: 'yes',
                    wanport: '3333',
                    upnpEnabled: 'no',
                    apikey: 'unraid_test_key',
                    localApiKey: 'test_local_key',
                    email: 'invalid-email',
                    username: 'testuser',
                    avatar: '',
                    regWizTime: '',
                    accesstoken: '',
                    idtoken: '',
                    refreshtoken: '',
                    dynamicRemoteAccessType: 'DISABLED',
                    ssoSubIds: '',
                },
            } as any;

            await expect(service.convertLegacyConfig(legacyConfig)).rejects.toThrow();
        });
    });
});
