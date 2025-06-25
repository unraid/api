import { ConfigService } from '@nestjs/config';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiConfigPersistence } from '@app/unraid-api/config/api-config.module.js';
import { ConfigPersistenceHelper } from '@app/unraid-api/config/persistence.helper.js';

describe('ApiConfigPersistence', () => {
    let service: ApiConfigPersistence;
    let configService: ConfigService;
    let persistenceHelper: ConfigPersistenceHelper;

    beforeEach(() => {
        configService = {
            get: vi.fn(),
            set: vi.fn(),
        } as any;

        persistenceHelper = {} as ConfigPersistenceHelper;
        service = new ApiConfigPersistence(configService, persistenceHelper);
    });

    describe('convertLegacyConfig', () => {
        it('should migrate sandbox from string "yes" to boolean true', () => {
            const legacyConfig = {
                local: { sandbox: 'yes' },
                api: { extraOrigins: '' },
                remote: { ssoSubIds: '' },
            };

            const result = service.convertLegacyConfig(legacyConfig);

            expect(result.sandbox).toBe(true);
        });

        it('should migrate sandbox from string "no" to boolean false', () => {
            const legacyConfig = {
                local: { sandbox: 'no' },
                api: { extraOrigins: '' },
                remote: { ssoSubIds: '' },
            };

            const result = service.convertLegacyConfig(legacyConfig);

            expect(result.sandbox).toBe(false);
        });

        it('should migrate extraOrigins from comma-separated string to array', () => {
            const legacyConfig = {
                local: { sandbox: 'no' },
                api: { extraOrigins: 'https://example.com,https://test.com' },
                remote: { ssoSubIds: '' },
            };

            const result = service.convertLegacyConfig(legacyConfig);

            expect(result.extraOrigins).toEqual(['https://example.com', 'https://test.com']);
        });

        it('should filter out non-HTTP origins from extraOrigins', () => {
            const legacyConfig = {
                local: { sandbox: 'no' },
                api: {
                    extraOrigins: 'https://example.com,invalid-origin,http://test.com,ftp://bad.com',
                },
                remote: { ssoSubIds: '' },
            };

            const result = service.convertLegacyConfig(legacyConfig);

            expect(result.extraOrigins).toEqual(['https://example.com', 'http://test.com']);
        });

        it('should handle empty extraOrigins string', () => {
            const legacyConfig = {
                local: { sandbox: 'no' },
                api: { extraOrigins: '' },
                remote: { ssoSubIds: '' },
            };

            const result = service.convertLegacyConfig(legacyConfig);

            expect(result.extraOrigins).toEqual([]);
        });

        it('should migrate ssoSubIds from comma-separated string to array', () => {
            const legacyConfig = {
                local: { sandbox: 'no' },
                api: { extraOrigins: '' },
                remote: { ssoSubIds: 'user1,user2,user3' },
            };

            const result = service.convertLegacyConfig(legacyConfig);

            expect(result.ssoSubIds).toEqual(['user1', 'user2', 'user3']);
        });

        it('should handle empty ssoSubIds string', () => {
            const legacyConfig = {
                local: { sandbox: 'no' },
                api: { extraOrigins: '' },
                remote: { ssoSubIds: '' },
            };

            const result = service.convertLegacyConfig(legacyConfig);

            expect(result.ssoSubIds).toEqual([]);
        });

        it('should handle undefined config sections', () => {
            const legacyConfig = {};

            const result = service.convertLegacyConfig(legacyConfig);

            expect(result.sandbox).toBe(false);
            expect(result.extraOrigins).toEqual([]);
            expect(result.ssoSubIds).toEqual([]);
        });

        it('should handle complete migration with all fields', () => {
            const legacyConfig = {
                local: { sandbox: 'yes' },
                api: { extraOrigins: 'https://app1.example.com,https://app2.example.com' },
                remote: { ssoSubIds: 'sub1,sub2,sub3' },
            };

            const result = service.convertLegacyConfig(legacyConfig);

            expect(result.sandbox).toBe(true);
            expect(result.extraOrigins).toEqual([
                'https://app1.example.com',
                'https://app2.example.com',
            ]);
            expect(result.ssoSubIds).toEqual(['sub1', 'sub2', 'sub3']);
        });
    });
});
