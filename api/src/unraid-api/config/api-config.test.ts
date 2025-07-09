import { ConfigService } from '@nestjs/config';
import { readFile } from 'node:fs/promises';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fileExists } from '@app/core/utils/files/file-exists.js';
import { ApiConfigPersistence, loadApiConfig } from '@app/unraid-api/config/api-config.module.js';
import { ConfigPersistenceHelper } from '@app/unraid-api/config/persistence.helper.js';

vi.mock('node:fs/promises');
vi.mock('@app/core/utils/files/file-exists.js');

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

describe('loadApiConfig', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    it('should return default config when file does not exist', async () => {
        vi.mocked(fileExists).mockResolvedValue(false);

        const result = await loadApiConfig();

        expect(result).toEqual({
            version: expect.any(String),
            extraOrigins: [],
            sandbox: false,
            ssoSubIds: [],
            plugins: [],
        });
    });

    it('should merge disk config with defaults when file exists', async () => {
        const diskConfig = {
            extraOrigins: ['https://example.com'],
            sandbox: true,
            ssoSubIds: ['sub1', 'sub2'],
        };

        vi.mocked(fileExists).mockResolvedValue(true);
        vi.mocked(readFile).mockResolvedValue(JSON.stringify(diskConfig));

        const result = await loadApiConfig();

        expect(result).toEqual({
            version: expect.any(String),
            extraOrigins: ['https://example.com'],
            sandbox: true,
            ssoSubIds: ['sub1', 'sub2'],
            plugins: [],
        });
    });

    it('should use default config when JSON parsing fails', async () => {
        vi.mocked(fileExists).mockResolvedValue(true);
        vi.mocked(readFile).mockResolvedValue('{ invalid json }');

        const result = await loadApiConfig();

        expect(console.error).toHaveBeenCalledWith(
            'Failed to load API config from disk, using defaults:',
            expect.any(Error)
        );
        expect(result).toEqual({
            version: expect.any(String),
            extraOrigins: [],
            sandbox: false,
            ssoSubIds: [],
            plugins: [],
        });
    });

    it('should use default config when file is empty', async () => {
        vi.mocked(fileExists).mockResolvedValue(true);
        vi.mocked(readFile).mockResolvedValue('');

        const result = await loadApiConfig();

        expect(console.error).not.toHaveBeenCalled();
        expect(result).toEqual({
            version: expect.any(String),
            extraOrigins: [],
            sandbox: false,
            ssoSubIds: [],
            plugins: [],
        });
    });

    it('should always override version with current API_VERSION', async () => {
        const diskConfig = {
            version: 'old-version',
            extraOrigins: ['https://example.com'],
        };

        vi.mocked(fileExists).mockResolvedValue(true);
        vi.mocked(readFile).mockResolvedValue(JSON.stringify(diskConfig));

        const result = await loadApiConfig();

        expect(result.version).not.toBe('old-version');
        expect(result.version).toBeTruthy();
    });
});
