import { Logger } from '@nestjs/common';
import { readFile } from 'node:fs/promises';
import { join } from 'path';

import type { Mock } from 'vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fileExists } from '@app/core/utils/files/file-exists.js';
import { ApiStateConfig } from '@app/unraid-api/config/factory/api-state.model.js';
import { ConfigPersistenceHelper } from '@app/unraid-api/config/persistence.helper.js';

vi.mock('node:fs/promises');
vi.mock('@app/core/utils/files/file-exists.js');
vi.mock('@app/environment.js', () => ({
    PATHS_CONFIG_MODULES: '/test/config/path',
}));

describe('ApiStateConfig', () => {
    let mockPersistenceHelper: ConfigPersistenceHelper;
    let mockLogger: Logger;

    interface TestConfig {
        name: string;
        value: number;
        enabled: boolean;
    }

    const defaultConfig: TestConfig = {
        name: 'test',
        value: 42,
        enabled: true,
    };

    const parseFunction = (data: unknown): TestConfig => {
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid config format');
        }
        return data as TestConfig;
    };

    beforeEach(() => {
        vi.clearAllMocks();

        mockPersistenceHelper = {
            persistIfChanged: vi.fn().mockResolvedValue(true),
        } as any;

        mockLogger = {
            log: vi.fn(),
            warn: vi.fn(),
            error: vi.fn(),
            debug: vi.fn(),
        } as any;

        vi.spyOn(Logger.prototype, 'log').mockImplementation(mockLogger.log);
        vi.spyOn(Logger.prototype, 'warn').mockImplementation(mockLogger.warn);
        vi.spyOn(Logger.prototype, 'error').mockImplementation(mockLogger.error);
        vi.spyOn(Logger.prototype, 'debug').mockImplementation(mockLogger.debug);
    });

    describe('constructor', () => {
        it('should initialize with cloned default config', () => {
            const config = new ApiStateConfig(
                {
                    name: 'test-config',
                    defaultConfig,
                    parse: parseFunction,
                },
                mockPersistenceHelper
            );

            expect(config.config).toEqual(defaultConfig);
            expect(config.config).not.toBe(defaultConfig);
        });
    });

    describe('token', () => {
        it('should generate correct token', () => {
            const config = new ApiStateConfig(
                {
                    name: 'my-config',
                    defaultConfig,
                    parse: parseFunction,
                },
                mockPersistenceHelper
            );

            expect(config.token).toBe('ApiConfig.my-config');
        });
    });

    describe('file paths', () => {
        it('should generate correct file name', () => {
            const config = new ApiStateConfig(
                {
                    name: 'test-config',
                    defaultConfig,
                    parse: parseFunction,
                },
                mockPersistenceHelper
            );

            expect(config.fileName).toBe('test-config.json');
        });

        it('should generate correct file path', () => {
            const config = new ApiStateConfig(
                {
                    name: 'test-config',
                    defaultConfig,
                    parse: parseFunction,
                },
                mockPersistenceHelper
            );

            expect(config.filePath).toBe(join('/test/config/path', 'test-config.json'));
        });
    });

    describe('parseConfig', () => {
        let config: ApiStateConfig<TestConfig>;

        beforeEach(() => {
            config = new ApiStateConfig(
                {
                    name: 'test-config',
                    defaultConfig,
                    parse: parseFunction,
                },
                mockPersistenceHelper
            );
        });

        it('should return undefined when file does not exist', async () => {
            (fileExists as Mock).mockResolvedValue(false);

            const result = await config.parseConfig();

            expect(result).toBeUndefined();
            expect(readFile).not.toHaveBeenCalled();
        });

        it('should parse valid JSON config', async () => {
            const validConfig = { name: 'custom', value: 100, enabled: false };
            (fileExists as Mock).mockResolvedValue(true);
            (readFile as Mock).mockResolvedValue(JSON.stringify(validConfig));

            const result = await config.parseConfig();

            expect(result).toEqual(validConfig);
            expect(readFile).toHaveBeenCalledWith(config.filePath, 'utf8');
        });

        it('should return undefined for empty file', async () => {
            (fileExists as Mock).mockResolvedValue(true);
            (readFile as Mock).mockResolvedValue('');

            const result = await config.parseConfig();

            expect(result).toBeUndefined();
            expect(mockLogger.warn).toHaveBeenCalledWith(expect.stringContaining('is empty'));
        });

        it('should return undefined for whitespace-only file', async () => {
            (fileExists as Mock).mockResolvedValue(true);
            (readFile as Mock).mockResolvedValue('   \n\t  ');

            const result = await config.parseConfig();

            expect(result).toBeUndefined();
            expect(mockLogger.warn).toHaveBeenCalledWith(expect.stringContaining('is empty'));
        });

        it('should throw error for invalid JSON', async () => {
            (fileExists as Mock).mockResolvedValue(true);
            (readFile as Mock).mockResolvedValue('{ invalid json }');

            await expect(config.parseConfig()).rejects.toThrow();
            expect(mockLogger.error).toHaveBeenCalledWith(
                expect.stringContaining('Failed to parse JSON')
            );
            expect(mockLogger.debug).toHaveBeenCalledWith(expect.stringContaining('{ invalid json }'));
        });

        it('should throw error for incomplete JSON', async () => {
            (fileExists as Mock).mockResolvedValue(true);
            (readFile as Mock).mockResolvedValue('{ "name": "test"');

            await expect(config.parseConfig()).rejects.toThrow();
            expect(mockLogger.error).toHaveBeenCalledWith(
                expect.stringContaining('Failed to parse JSON')
            );
        });

        it('should use custom file path when provided', async () => {
            const customPath = '/custom/path/config.json';
            (fileExists as Mock).mockResolvedValue(true);
            (readFile as Mock).mockResolvedValue(JSON.stringify(defaultConfig));

            await config.parseConfig({ filePath: customPath });

            expect(fileExists).toHaveBeenCalledWith(customPath);
            expect(readFile).toHaveBeenCalledWith(customPath, 'utf8');
        });
    });

    describe('persist', () => {
        let config: ApiStateConfig<TestConfig>;

        beforeEach(() => {
            config = new ApiStateConfig(
                {
                    name: 'test-config',
                    defaultConfig,
                    parse: parseFunction,
                },
                mockPersistenceHelper
            );
        });

        it('should persist current config when no argument provided', async () => {
            const result = await config.persist();

            expect(result).toBe(true);
            expect(mockPersistenceHelper.persistIfChanged).toHaveBeenCalledWith(
                config.filePath,
                defaultConfig
            );
        });

        it('should persist provided config', async () => {
            const customConfig = { name: 'custom', value: 999, enabled: false };

            const result = await config.persist(customConfig);

            expect(result).toBe(true);
            expect(mockPersistenceHelper.persistIfChanged).toHaveBeenCalledWith(
                config.filePath,
                customConfig
            );
        });

        it('should return false and log error on persistence failure', async () => {
            (mockPersistenceHelper.persistIfChanged as Mock).mockResolvedValue(false);

            const result = await config.persist();

            expect(result).toBe(false);
            expect(mockLogger.error).toHaveBeenCalledWith(
                expect.stringContaining('Could not write config')
            );
        });
    });

    describe('load', () => {
        let config: ApiStateConfig<TestConfig>;

        beforeEach(() => {
            config = new ApiStateConfig(
                {
                    name: 'test-config',
                    defaultConfig,
                    parse: parseFunction,
                },
                mockPersistenceHelper
            );
        });

        it('should load config from file when it exists', async () => {
            const savedConfig = { name: 'saved', value: 200, enabled: true };
            (fileExists as Mock).mockResolvedValue(true);
            (readFile as Mock).mockResolvedValue(JSON.stringify(savedConfig));

            await config.load();

            expect(config.config).toEqual(savedConfig);
        });

        it('should create default config when file does not exist', async () => {
            (fileExists as Mock).mockResolvedValue(false);

            await config.load();

            expect(config.config).toEqual(defaultConfig);
            expect(mockLogger.log).toHaveBeenCalledWith(
                expect.stringContaining('Config file does not exist')
            );
            expect(mockPersistenceHelper.persistIfChanged).toHaveBeenCalledWith(
                config.filePath,
                defaultConfig
            );
        });

        it('should not modify config when file is invalid', async () => {
            (fileExists as Mock).mockResolvedValue(true);
            (readFile as Mock).mockResolvedValue('invalid json');

            await config.load();

            expect(config.config).toEqual(defaultConfig);
            expect(mockLogger.warn).toHaveBeenCalledWith(
                expect.any(Error),
                expect.stringContaining('is invalid')
            );
        });

        it('should not throw even when persist fails', async () => {
            (fileExists as Mock).mockResolvedValue(false);
            (mockPersistenceHelper.persistIfChanged as Mock).mockResolvedValue(false);

            await expect(config.load()).resolves.not.toThrow();

            expect(config.config).toEqual(defaultConfig);
        });
    });

    describe('update', () => {
        let config: ApiStateConfig<TestConfig>;

        beforeEach(() => {
            config = new ApiStateConfig(
                {
                    name: 'test-config',
                    defaultConfig,
                    parse: parseFunction,
                },
                mockPersistenceHelper
            );
        });

        it('should update config with partial values', () => {
            config.update({ value: 123 });

            expect(config.config).toEqual({
                name: 'test',
                value: 123,
                enabled: true,
            });
        });

        it('should return self for chaining', () => {
            const result = config.update({ enabled: false });

            expect(result).toBe(config);
        });

        it('should validate updated config through parse function', () => {
            const badParseFunction = vi.fn().mockImplementation(() => {
                throw new Error('Validation failed');
            });

            const strictConfig = new ApiStateConfig(
                {
                    name: 'strict-config',
                    defaultConfig,
                    parse: badParseFunction,
                },
                mockPersistenceHelper
            );

            expect(() => strictConfig.update({ value: -1 })).toThrow('Validation failed');
        });
    });
});
