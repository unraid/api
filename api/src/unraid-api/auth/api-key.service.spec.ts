import { Logger } from '@nestjs/common';
import { readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';

import { ensureDir, ensureDirSync } from 'fs-extra';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ZodError } from 'zod';

import type { ApiKey, ApiKeyWithSecret } from '@app/graphql/generated/api/types';
import { ApiKeySchema, ApiKeyWithSecretSchema } from '@app/graphql/generated/api/operations';
import { Resource, Role } from '@app/graphql/generated/api/types';
import { getters, store } from '@app/store';
import { updateUserConfig } from '@app/store/modules/config';
import { FileLoadStatus } from '@app/store/types';

import { ApiKeyService } from './api-key.service';

// Mock the store and its modules
vi.mock('@app/store', () => ({
    getters: {
        config: vi.fn(),
        paths: vi.fn(),
    },
    store: {
        dispatch: vi.fn(),
        getState: vi.fn(),
    },
}));

vi.mock('@app/store/modules/config', () => ({
    updateUserConfig: vi.fn(),
}));

// Mock fs/promises
vi.mock('fs/promises', async () => ({
    readdir: vi.fn().mockResolvedValue(['key1.json', 'key2.json', 'notakey.txt']),
    readFile: vi.fn(),
    writeFile: vi.fn(),
}));

vi.mock('@app/graphql/generated/api/operations', () => ({
    ApiKeyWithSecretSchema: vi.fn(),
    ApiKeySchema: vi.fn(),
}));

vi.mock('fs-extra', () => ({
    ensureDir: vi.fn(),
    ensureDirSync: vi.fn(),
}));

describe('ApiKeyService', () => {
    let apiKeyService: ApiKeyService;
    let mockLogger: {
        log: ReturnType<typeof vi.fn>;
        error: ReturnType<typeof vi.fn>;
        warn: ReturnType<typeof vi.fn>;
        debug: ReturnType<typeof vi.fn>;
        verbose: ReturnType<typeof vi.fn>;
    };
    const mockBasePath = '/mock/path/to/keys';

    const mockApiKey: ApiKey = {
        id: 'test-api-id',
        name: 'Test API Key',
        description: 'Test API Key Description',
        roles: [Role.GUEST],
        permissions: [],
        createdAt: new Date().toISOString(),
    };

    const mockApiKeyWithSecret: ApiKeyWithSecret = {
        id: 'test-api-id',
        key: 'test-api-key',
        name: 'Test API Key',
        description: 'Test API Key Description',
        roles: [Role.GUEST],
        permissions: [
            {
                resource: Resource.CONNECT,
                actions: ['read'],
            },
        ],
        createdAt: new Date().toISOString(),
    };

    beforeEach(async () => {
        vi.resetAllMocks();

        // Create mock logger methods
        mockLogger = {
            log: vi.fn(),
            error: vi.fn(),
            warn: vi.fn(),
            debug: vi.fn(),
            verbose: vi.fn(),
        };

        // Mock the Logger constructor
        vi.spyOn(Logger.prototype, 'log').mockImplementation(mockLogger.log);
        vi.spyOn(Logger.prototype, 'error').mockImplementation(mockLogger.error);
        vi.spyOn(Logger.prototype, 'warn').mockImplementation(mockLogger.warn);
        vi.spyOn(Logger.prototype, 'debug').mockImplementation(mockLogger.debug);
        vi.spyOn(Logger.prototype, 'verbose').mockImplementation(mockLogger.verbose);

        // Mock the paths getter
        vi.mocked(getters.paths).mockReturnValue({
            'auth-keys': mockBasePath,
        } as any);

        // Set up default config mock
        vi.mocked(getters.config).mockReturnValue({
            status: FileLoadStatus.LOADED,
            remote: {
                apikey: null,
                localApiKey: null,
            },
        } as any);

        // Mock ensureDir
        vi.mocked(ensureDir).mockResolvedValue();

        apiKeyService = new ApiKeyService();

        vi.spyOn(apiKeyService as any, 'generateApiKey').mockReturnValue('test-api-key');
        vi.mock('uuid', () => ({
            v4: () => 'test-api-id',
        }));

        // Add default schema mocks
        vi.mocked(ApiKeyWithSecretSchema).mockReturnValue({
            parse: vi.fn().mockImplementation((data) => data),
        } as any);
        vi.mocked(ApiKeySchema).mockReturnValue({
            parse: vi.fn().mockImplementation((data) => data),
        } as any);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('initialization', () => {
        it('should ensure directory exists', async () => {
            const service = new ApiKeyService();
            expect(ensureDirSync).toHaveBeenCalledWith(mockBasePath);
        });

        it('should return correct base path', async () => {
            vi.mocked(ensureDir).mockResolvedValue();
            const paths = apiKeyService.getPaths();

            expect(paths.basePath).toBe(mockBasePath);
        });
    });

    describe('create', () => {
        it('should create ApiKeyWithSecret with generated key', async () => {
            const saveSpy = vi.spyOn(apiKeyService, 'saveApiKey').mockResolvedValue();
            const { key, id, description, roles } = mockApiKeyWithSecret;
            const name = 'Test API Key';

            const result = await apiKeyService.create(name, description ?? '', roles);

            expect(result).toMatchObject({
                id,
                key,
                name: name,
                description,
                roles,
                createdAt: expect.any(String),
            });

            expect(saveSpy).toHaveBeenCalledWith(result);
        });

        it('should validate input parameters', async () => {
            const saveSpy = vi.spyOn(apiKeyService, 'saveApiKey');

            await expect(apiKeyService.create('', 'desc', [Role.GUEST])).rejects.toThrow(
                'API key name must contain only letters, numbers, and spaces (Unicode letters are supported)'
            );

            await expect(apiKeyService.create('name', 'desc', [])).rejects.toThrow(
                'At least one role must be specified'
            );

            await expect(apiKeyService.create('name', 'desc', ['invalid_role' as Role])).rejects.toThrow(
                'Invalid role specified'
            );

            expect(saveSpy).not.toHaveBeenCalled();
        });
    });

    describe('createLocalApiKeyForConnectIfNecessary', () => {
        beforeEach(() => {
            // Mock config getter
            vi.mocked(getters.config).mockReturnValue({
                status: FileLoadStatus.LOADED,
                remote: {
                    apikey: 'remote-api-key',
                    localApiKey: null,
                },
            } as any);

            // Mock store dispatch
            vi.mocked(store.dispatch).mockResolvedValue({} as any);
        });

        it('should not create key if config is not loaded', async () => {
            vi.mocked(getters.config).mockReturnValue({
                status: FileLoadStatus.UNLOADED,
            } as any);

            await apiKeyService['createLocalApiKeyForConnectIfNecessary']();

            expect(mockLogger.error).toHaveBeenCalledWith(
                'Config file not loaded, cannot create local API key'
            );
            expect(store.dispatch).not.toHaveBeenCalled();
        });

        it('should not create key if remote apikey is not set', async () => {
            vi.mocked(getters.config).mockReturnValue({
                status: FileLoadStatus.LOADED,
                remote: {
                    apikey: null,
                    localApiKey: null,
                },
            } as any);

            await apiKeyService['createLocalApiKeyForConnectIfNecessary']();

            expect(store.dispatch).not.toHaveBeenCalled();
        });

        it('should not create key if Connect key already exists', async () => {
            vi.spyOn(apiKeyService, 'findByField').mockReturnValue(mockApiKeyWithSecret);

            await apiKeyService['createLocalApiKeyForConnectIfNecessary']();

            expect(store.dispatch).not.toHaveBeenCalled();
        });

        it('should create new Connect key and update config', async () => {
            vi.spyOn(apiKeyService, 'findByField').mockReturnValue(null);
            vi.spyOn(apiKeyService, 'create').mockResolvedValue(mockApiKeyWithSecret);

            await apiKeyService['createLocalApiKeyForConnectIfNecessary']();

            expect(apiKeyService.create).toHaveBeenCalledWith(
                'Connect',
                'API key for Connect user',
                [Role.CONNECT],
                true
            );
            expect(store.dispatch).toHaveBeenCalledWith(
                updateUserConfig({
                    remote: {
                        localApiKey: mockApiKeyWithSecret.key,
                    },
                })
            );
        });

        it('should throw error if key creation fails', async () => {
            vi.spyOn(apiKeyService, 'findByField').mockReturnValue(null);
            vi.spyOn(apiKeyService, 'create').mockResolvedValue({
                ...mockApiKeyWithSecret,
                key: '', // Empty string instead of undefined/null
            } as ApiKeyWithSecret);

            await expect(apiKeyService['createLocalApiKeyForConnectIfNecessary']()).rejects.toThrow(
                'Failed to create local API key'
            );
            expect(mockLogger.error).toHaveBeenCalledWith(
                'Failed to create local API key - no key returned'
            );
            expect(store.dispatch).not.toHaveBeenCalled();
        });
    });

    describe('findAll', () => {
        it('should return all API keys', async () => {
            vi.spyOn(apiKeyService, 'loadAllFromDisk').mockResolvedValue([
                mockApiKeyWithSecret,
                { ...mockApiKeyWithSecret, id: 'second-id' },
            ]);
            await apiKeyService.onModuleInit();

            vi.mocked(ApiKeySchema).mockReturnValue({
                parse: vi.fn().mockReturnValue(mockApiKey),
            } as any);

            const result = await apiKeyService.findAll();

            expect(result).toHaveLength(2);
            expect(result[0]).toEqual(mockApiKey);
            expect(result[1]).toEqual(mockApiKey);
        });

        it('should handle file read errors gracefully', async () => {
            vi.spyOn(apiKeyService, 'loadAllFromDisk').mockRejectedValue(new Error('Read error'));
            await expect(apiKeyService.onModuleInit()).rejects.toThrow('Read error');
        });
    });

    describe('findById', () => {
        it('should return API key by id when found', async () => {
            vi.spyOn(apiKeyService, 'loadAllFromDisk').mockResolvedValue([mockApiKeyWithSecret]);
            await apiKeyService.onModuleInit();

            vi.mocked(ApiKeySchema).mockReturnValue({
                parse: vi.fn().mockReturnValue(mockApiKey),
            } as any);

            const result = await apiKeyService.findById(mockApiKeyWithSecret.id);

            expect(result).toEqual(mockApiKey);
        });

        it('should return null if API key not found', async () => {
            vi.spyOn(apiKeyService, 'loadAllFromDisk').mockResolvedValue([
                { ...mockApiKeyWithSecret, id: 'different-id' },
            ]);
            await apiKeyService.onModuleInit();

            const result = await apiKeyService.findById('non-existent-id');

            expect(result).toBeNull();
        });

        it('should throw error if schema validation fails', async () => {
            vi.spyOn(apiKeyService, 'loadAllFromDisk').mockResolvedValue([mockApiKeyWithSecret]);
            await apiKeyService.onModuleInit();

            vi.mocked(ApiKeySchema).mockReturnValue({
                parse: vi.fn().mockImplementation(() => {
                    throw new ZodError([
                        {
                            code: 'custom',
                            path: ['roles'],
                            message: 'Invalid role',
                        },
                    ]);
                }),
            } as any);

            expect(() => apiKeyService.findById(mockApiKeyWithSecret.id)).toThrow(
                'Invalid API key structure'
            );
        });
    });

    describe('findByIdWithSecret', () => {
        it('should return API key with secret when found', async () => {
            vi.spyOn(apiKeyService, 'loadAllFromDisk').mockResolvedValue([mockApiKeyWithSecret]);
            await apiKeyService.onModuleInit();

            const result = await apiKeyService.findByIdWithSecret(mockApiKeyWithSecret.id);

            expect(result).toEqual(mockApiKeyWithSecret);
        });

        it('should return null when API key not found', async () => {
            vi.spyOn(apiKeyService, 'loadAllFromDisk').mockResolvedValue([]);
            await apiKeyService.onModuleInit();

            const result = await apiKeyService.findByIdWithSecret('non-existent-id');

            expect(result).toBeNull();
        });

        it('should throw GraphQLError on invalid data structure', async () => {
            vi.spyOn(apiKeyService, 'loadAllFromDisk').mockImplementation(async () => {
                throw new Error('Invalid API key structure');
            });

            await expect(apiKeyService.onModuleInit()).rejects.toThrow('Invalid API key structure');
        });

        it('should throw error on file read error', async () => {
            vi.spyOn(apiKeyService, 'loadAllFromDisk').mockRejectedValue(new Error('Read failed'));
            await expect(apiKeyService.onModuleInit()).rejects.toThrow('Read failed');
        });
    });

    describe('findByKey', () => {
        it('should return API key by key value when multiple keys exist', async () => {
            const differentKey = { ...mockApiKeyWithSecret, key: 'different-key' };
            vi.spyOn(apiKeyService, 'loadAllFromDisk').mockResolvedValue([
                differentKey,
                mockApiKeyWithSecret,
            ]);

            await apiKeyService.onModuleInit();

            vi.mocked(ApiKeyWithSecretSchema).mockReturnValue({
                parse: vi.fn().mockImplementation((data) => data),
            } as any);

            const result = await apiKeyService.findByKey(mockApiKeyWithSecret.key);

            expect(result).toEqual(mockApiKeyWithSecret);
        });

        it('should return null if key not found in any file', async () => {
            vi.spyOn(apiKeyService, 'loadAllFromDisk').mockResolvedValue([
                { ...mockApiKeyWithSecret, key: 'different-key-1' },
                { ...mockApiKeyWithSecret, key: 'different-key-2' },
            ]);
            await apiKeyService.onModuleInit();

            vi.mocked(ApiKeyWithSecretSchema).mockReturnValue({
                parse: vi.fn().mockImplementation((data) => data),
            } as any);

            const result = await apiKeyService.findByKey('non-existent-key');

            expect(result).toBeNull();
        });

        it('Should throw error when API key is corrupted', async () => {
            vi.spyOn(apiKeyService, 'loadAllFromDisk').mockRejectedValue(
                new Error('Authentication system error: Corrupted key file')
            );

            await expect(apiKeyService.onModuleInit()).rejects.toThrow(
                'Authentication system error: Corrupted key file'
            );
        });
    });

    describe('findOneByKey', () => {
        it('should return UserAccount when API key exists', async () => {
            const findByKeySpy = vi
                .spyOn(apiKeyService, 'findByKey')
                .mockResolvedValue(mockApiKeyWithSecret);
            const result = await apiKeyService.findOneByKey('test-api-key');

            expect(result).toEqual({
                id: mockApiKeyWithSecret.id,
                name: mockApiKeyWithSecret.name,
                description: mockApiKeyWithSecret.description,
                roles: mockApiKeyWithSecret.roles,
            });
            expect(findByKeySpy).toHaveBeenCalledWith('test-api-key');
        });

        it('should use default description when none provided', async () => {
            const keyWithoutDesc = { ...mockApiKeyWithSecret, description: null };
            vi.spyOn(apiKeyService, 'findByKey').mockResolvedValue(keyWithoutDesc);
            const result = await apiKeyService.findOneByKey('test-api-key');

            expect(result).toEqual({
                id: keyWithoutDesc.id,
                name: keyWithoutDesc.name,
                description: `API Key ${keyWithoutDesc.name}`,
                roles: keyWithoutDesc.roles,
            });
        });

        it('should return null when API key not found', async () => {
            vi.spyOn(apiKeyService, 'findByKey').mockResolvedValue(null);

            await expect(apiKeyService.findOneByKey('non-existent-key')).rejects.toThrow(
                'API key not found'
            );
        });

        it('should throw error when API key not found', async () => {
            vi.spyOn(apiKeyService, 'findByKey').mockResolvedValue(null);

            await expect(apiKeyService.findOneByKey('non-existent-key')).rejects.toThrow(
                'API key not found'
            );
        });

        it('should throw error when unexpected error occurs', async () => {
            vi.spyOn(apiKeyService, 'findByKey').mockRejectedValue(new Error('Test error'));

            await expect(apiKeyService.findOneByKey('test-api-key')).rejects.toThrow(
                'Failed to retrieve user account'
            );
        });
    });

    describe('saveApiKey', () => {
        it('should save API key to file', async () => {
            vi.mocked(ApiKeyWithSecretSchema).mockReturnValue({
                parse: vi.fn().mockReturnValue(mockApiKeyWithSecret),
            } as any);

            vi.mocked(writeFile).mockResolvedValue(undefined);

            await apiKeyService.saveApiKey(mockApiKeyWithSecret);

            const writeFileCalls = vi.mocked(writeFile).mock.calls;

            expect(writeFileCalls.length).toBe(1);

            const [filePath, fileContent] = writeFileCalls[0] ?? [];
            const expectedPath = join(mockBasePath, `${mockApiKeyWithSecret.id}.json`);

            expect(filePath).toBe(expectedPath);

            if (typeof fileContent === 'string') {
                const savedApiKey = JSON.parse(fileContent);

                expect(savedApiKey).toEqual(mockApiKeyWithSecret);
            } else {
                throw new Error('File content should be a string');
            }
        });

        it('should throw GraphQLError on write error', async () => {
            vi.mocked(ApiKeyWithSecretSchema).mockReturnValue({
                parse: vi.fn().mockReturnValue(mockApiKeyWithSecret),
            } as any);

            vi.mocked(writeFile).mockRejectedValue(new Error('Write failed'));

            await expect(apiKeyService.saveApiKey(mockApiKeyWithSecret)).rejects.toThrow(
                'Failed to save API key: Write failed'
            );
        });

        it('should throw GraphQLError on invalid API key structure', async () => {
            vi.mocked(ApiKeyWithSecretSchema).mockReturnValue({
                parse: vi.fn().mockImplementation(() => {
                    throw new ZodError([
                        {
                            code: 'custom',
                            path: ['name'],
                            message: 'Name cannot be empty',
                        },
                    ]);
                }),
            } as any);

            const invalidApiKey = {
                ...mockApiKeyWithSecret,
                name: '', // Invalid: name cannot be empty
            } as ApiKeyWithSecret;

            await expect(apiKeyService.saveApiKey(invalidApiKey)).rejects.toThrow(
                'Failed to save API key: Invalid data structure'
            );
        });

        it('should throw GraphQLError when roles array is empty', async () => {
            vi.mocked(ApiKeyWithSecretSchema).mockReturnValue({
                parse: vi.fn().mockImplementation(() => {
                    throw new ZodError([
                        {
                            code: 'custom',
                            path: ['roles'],
                            message: 'Roles array cannot be empty',
                        },
                    ]);
                }),
            } as any);

            const invalidApiKey = {
                ...mockApiKeyWithSecret,
                roles: [], // Invalid: roles cannot be empty
            } as ApiKeyWithSecret;

            await expect(apiKeyService.saveApiKey(invalidApiKey)).rejects.toThrow(
                'Failed to save API key: Invalid data structure'
            );
        });
    });

    describe('loadAllFromDisk', () => {
        it('should load and parse all JSON files', async () => {
            const mockFiles = ['key1.json', 'key2.json', 'notakey.txt'];

            vi.mocked(readdir).mockResolvedValue(mockFiles as any);
            vi.mocked(readFile).mockResolvedValue(JSON.stringify(mockApiKeyWithSecret));
            vi.mocked(ApiKeyWithSecretSchema).mockReturnValue({
                parse: vi.fn().mockReturnValue(mockApiKeyWithSecret),
            } as any);

            const result = await apiKeyService.loadAllFromDisk();

            expect(result).toHaveLength(2);
            expect(result[0]).toEqual(mockApiKeyWithSecret);
            expect(readFile).toHaveBeenCalledTimes(2);
        });

        it('should throw error when directory read fails', async () => {
            vi.mocked(readdir).mockRejectedValue(new Error('Directory read failed'));

            await expect(apiKeyService.loadAllFromDisk()).rejects.toThrow('Failed to list API keys');

            expect(mockLogger.error).toHaveBeenCalledWith(
                expect.stringContaining('Failed to read API key directory')
            );
        });
    });

    describe('loadApiKeyFile', () => {
        it('should load and parse a valid API key file', async () => {
            vi.mocked(readFile).mockResolvedValue(JSON.stringify(mockApiKeyWithSecret));
            vi.mocked(ApiKeyWithSecretSchema).mockReturnValue({
                parse: vi.fn().mockReturnValue(mockApiKeyWithSecret),
            } as any);

            const result = await apiKeyService['loadApiKeyFile']('test.json');

            expect(result).toEqual(mockApiKeyWithSecret);
            expect(readFile).toHaveBeenCalledWith(join(mockBasePath, 'test.json'), 'utf8');
        });

        it('should return null when file read fails', async () => {
            vi.mocked(readFile).mockRejectedValue(new Error('File read failed'));

            const result = await apiKeyService['loadApiKeyFile']('test.json');

            expect(result).toBeNull();
            expect(mockLogger.warn).toHaveBeenCalledWith(
                expect.stringContaining('Error reading API key file test.json')
            );
        });

        it('should throw error on corrupted JSON', async () => {
            vi.mocked(readFile).mockResolvedValue('invalid json');

            await expect(apiKeyService['loadApiKeyFile']('test.json')).rejects.toThrow(
                'Authentication system error: Corrupted key file'
            );
        });

        it('should throw error on invalid API key structure', async () => {
            vi.mocked(readFile).mockResolvedValue(JSON.stringify({ invalid: 'structure' }));
            vi.mocked(ApiKeyWithSecretSchema).mockReturnValue({
                parse: vi.fn().mockImplementation(() => {
                    throw new ZodError([
                        {
                            code: 'custom',
                            path: [],
                            message: 'Invalid structure',
                        },
                    ]);
                }),
            } as any);

            await expect(apiKeyService['loadApiKeyFile']('test.json')).rejects.toThrow(
                'Invalid API key structure'
            );

            expect(mockLogger.error).toHaveBeenCalledWith(
                expect.stringContaining('Invalid API key structure in file test.json'),
                expect.any(Array)
            );
        });
    });
});
