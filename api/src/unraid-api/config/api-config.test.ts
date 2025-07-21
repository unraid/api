import { ConfigService } from '@nestjs/config';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fileExists } from '@app/core/utils/files/file-exists.js';
import { ApiConfigPersistence, loadApiConfig } from '@app/unraid-api/config/api-config.module.js';

// Mock file utilities
vi.mock('@app/core/utils/files/file-exists.js', () => ({
    fileExists: vi.fn(),
}));

vi.mock('@unraid/shared/util/file.js', () => ({
    fileExists: vi.fn(),
}));

// Mock fs/promises for file I/O operations
vi.mock('fs/promises', () => ({
    readFile: vi.fn(),
    writeFile: vi.fn(),
}));

describe('ApiConfigPersistence', () => {
    let service: ApiConfigPersistence;
    let configService: ConfigService;

    beforeEach(() => {
        configService = {
            get: vi.fn(),
            set: vi.fn(),
            getOrThrow: vi.fn().mockReturnValue('test-config-path'),
        } as any;

        service = new ApiConfigPersistence(configService);
    });

    describe('required ConfigFilePersister methods', () => {
        it('should return correct file name', () => {
            expect(service.fileName()).toBe('api.json');
        });

        it('should return correct config key', () => {
            expect(service.configKey()).toBe('api');
        });

        it('should return default config', () => {
            const defaultConfig = service.defaultConfig();
            expect(defaultConfig).toEqual({
                version: expect.any(String),
                extraOrigins: [],
                sandbox: false,
                ssoSubIds: [],
                plugins: [],
            });
        });

        it('should migrate config from legacy format', async () => {
            const mockLegacyConfig = {
                local: { sandbox: 'yes' },
                api: { extraOrigins: 'https://example.com,https://test.com' },
                remote: { ssoSubIds: 'sub1,sub2' },
            };

            vi.mocked(configService.get).mockReturnValue(mockLegacyConfig);

            const result = await service.migrateConfig();

            expect(result).toEqual({
                version: expect.any(String),
                extraOrigins: ['https://example.com', 'https://test.com'],
                sandbox: true,
                ssoSubIds: ['sub1', 'sub2'],
                plugins: [],
            });
        });
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

describe('loadApiConfig', () => {
    beforeEach(async () => {
        vi.clearAllMocks();
    });

    it('should return default config with current API_VERSION', async () => {
        const result = await loadApiConfig();

        expect(result).toEqual({
            version: expect.any(String),
            extraOrigins: [],
            sandbox: false,
            ssoSubIds: [],
            plugins: [],
        });
    });

    it('should handle errors gracefully and return defaults', async () => {
        const result = await loadApiConfig();

        expect(result).toEqual({
            version: expect.any(String),
            extraOrigins: [],
            sandbox: false,
            ssoSubIds: [],
            plugins: [],
        });
    });
});
