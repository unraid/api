import { ConfigService } from '@nestjs/config';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ConnectConfigPersister } from '../service/config.persistence.js';
import { ConfigType } from '../model/connect-config.model.js';

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

        service = new ConnectConfigPersister(configService);
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
                    ssoSubIds: ''
                }
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
                    ssoSubIds: ''
                }
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
                    ssoSubIds: ''
                }
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
                    ssoSubIds: ''
                }
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
                    ssoSubIds: ''
                }
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
                    ssoSubIds: ''
                }
            } as any;

            const result = await service.convertLegacyConfig(legacyConfig);

            expect(result.apikey).toBe('unraid_sfHboeSNzTzx24816QBssqi0A3nIT0f4Xg4c9Ht49WQfQKLMojU81Sb3f');
            expect(result.localApiKey).toBe('101d204832d24fc7e5d387f6fce47067ba230f8aa0ac3bcc6c12a415aa27dbd9');
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
                    ssoSubIds: 'sub1,sub2'
                }
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
            expect(result.accesstoken).toBe('access_token_value');
            expect(result.idtoken).toBe('id_token_value');
            expect(result.refreshtoken).toBe('refresh_token_value');
            expect(result.dynamicRemoteAccessType).toBe('UPNP');
        });

        it('should validate the migrated config and reject invalid email', async () => {
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
                    ssoSubIds: ''
                }
            } as any;

            await expect(service.convertLegacyConfig(legacyConfig)).rejects.toThrow();
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

            // Verify the end-to-end conversion (extraOrigins and ssoSubIds are now handled by API config)
            expect(result.wanaccess).toBe(true);
            expect(result.wanport).toBe(8080);
            expect(result.upnpEnabled).toBe(true);
        });
    });
}); 