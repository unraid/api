import { Logger } from '@nestjs/common';
import { readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';



import { ensureDir } from 'fs-extra';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ZodError } from 'zod';



import type { ApiKey, ApiKeyWithSecret } from '@app/graphql/generated/api/types';
import { ApiKeySchema, ApiKeyWithSecretSchema } from '@app/graphql/generated/api/operations';
import { Role } from '@app/graphql/generated/api/types';
import { getters } from '@app/store';



import { ApiKeyService } from './api-key.service';


vi.mock('fs/promises', async () => ({
    readdir: vi.fn(),
    readFile: vi.fn(),
    writeFile: vi.fn(),
}));
vi.mock('@app/store');
vi.mock('@app/graphql/generated/api/operations', () => ({
    ApiKeyWithSecretSchema: vi.fn(),
    ApiKeySchema: vi.fn(),
}));
vi.mock('fs-extra', () => ({
    ensureDir: vi.fn(),
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
        createdAt: new Date().toISOString(),
    };

    const mockApiKeyWithSecret: ApiKeyWithSecret = {
        id: 'test-api-id',
        key: 'test-api-key',
        name: 'Test API Key',
        description: 'Test API Key Description',
        roles: [Role.GUEST],
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

        // Mock ensureDir
        vi.mocked(ensureDir).mockResolvedValue();

        apiKeyService = new ApiKeyService();
        await apiKeyService.initialize();

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
            vi.mocked(ensureDir).mockResolvedValue();
            const service = new ApiKeyService();

            await service.initialize();

            expect(ensureDir).toHaveBeenCalledWith(mockBasePath);
        });

        it('should return correct paths', async () => {
            vi.mocked(ensureDir).mockResolvedValue();
            const paths = apiKeyService.getPaths();
            const testId = 'test-id';

            expect(paths.basePath).toBe(mockBasePath);
            expect(paths.keyFile(testId)).toBe(join(mockBasePath, `${testId}.json`));
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
                'API key name must be alphanumeric + spaces'
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

    describe('findAll', () => {
        it('should return all API keys', async () => {
            vi.mocked(readdir).mockResolvedValue(['key1.json', 'key2.json'] as any);
            vi.mocked(readFile).mockResolvedValue(JSON.stringify(mockApiKey));

            const result = await apiKeyService.findAll();

            expect(result).toHaveLength(2);
            expect(result[0]).toEqual(mockApiKey);
            expect(result[1]).toEqual(mockApiKey);
        });

        it('should handle file read errors gracefully', async () => {
            vi.mocked(readdir).mockResolvedValue(['key1.json', 'key2.json'] as any);
            vi.mocked(readFile).mockRejectedValue(new Error('Read error'));

            const result = await apiKeyService.findAll();

            expect(result).toHaveLength(0);
        });
    });

    describe('findById', () => {
        it('should return API key by id', async () => {
            vi.mocked(readFile).mockResolvedValue(JSON.stringify(mockApiKey));
            vi.mocked(ApiKeySchema).mockReturnValue({
                parse: vi.fn().mockReturnValue(mockApiKey),
            } as any);

            const result = await apiKeyService.findById(mockApiKey.id);

            expect(result).toEqual(mockApiKey);
        });

        it('should return null if API key not found (ENOENT error)', async () => {
            const error = new Error('ENOENT') as NodeJS.ErrnoException;

            error.code = 'ENOENT';
            vi.mocked(readFile).mockRejectedValue(error);

            const result = await apiKeyService.findById('non-existent-id');

            expect(result).toBeNull();
        });

        it('should throw GraphQLError if JSON parsing fails', async () => {
            vi.mocked(readFile).mockResolvedValue('invalid json');

            await expect(apiKeyService.findById(mockApiKey.id)).rejects.toThrow(
                'Failed to read API key'
            );
        });
    });

    describe('findByIdWithSecret', () => {
        it('should return API key with secret when found', async () => {
            vi.mocked(readFile).mockResolvedValue(JSON.stringify(mockApiKeyWithSecret));
            vi.mocked(ApiKeyWithSecretSchema).mockReturnValue({
                parse: vi.fn().mockReturnValue(mockApiKeyWithSecret),
            } as any);

            const result = await apiKeyService.findByIdWithSecret(mockApiKeyWithSecret.id);

            expect(result).toEqual(mockApiKeyWithSecret);
            expect(readFile).toHaveBeenCalledWith(
                join(mockBasePath, `${mockApiKeyWithSecret.id}.json`),
                'utf8'
            );
        });

        it('should return null when API key not found', async () => {
            vi.mocked(readFile).mockRejectedValue({ code: 'ENOENT' });

            const result = await apiKeyService.findByIdWithSecret('non-existent-id');

            expect(result).toBeNull();
        });

        it('should throw GraphQLError on invalid data structure', async () => {
            vi.mocked(readFile).mockResolvedValue(JSON.stringify(mockApiKeyWithSecret));
            vi.mocked(ApiKeyWithSecretSchema).mockReturnValue({
                parse: vi.fn().mockImplementation(() => {
                    throw new ZodError([]);
                }),
            } as any);

            await expect(apiKeyService.findByIdWithSecret(mockApiKeyWithSecret.id)).rejects.toThrow(
                'Invalid API key data structure'
            );
        });

        it('should throw GraphQLError on file read error', async () => {
            vi.mocked(readFile).mockRejectedValue(new Error('Read failed'));

            await expect(apiKeyService.findByIdWithSecret(mockApiKeyWithSecret.id)).rejects.toThrow(
                'Failed to read API key file'
            );
        });
    });

    describe('findByKey', () => {
        it('should return API key by key value when multiple keys exist', async () => {
            vi.mocked(readdir).mockResolvedValue(['key1.json', 'key2.json'] as any);
            vi.mocked(readFile)
                .mockResolvedValueOnce(JSON.stringify({ ...mockApiKeyWithSecret, key: 'different-key' }))
                .mockResolvedValueOnce(JSON.stringify(mockApiKeyWithSecret));

            vi.mocked(ApiKeyWithSecretSchema).mockReturnValue({
                parse: vi.fn().mockImplementation((data) => data),
            } as any);

            const result = await apiKeyService.findByKey(mockApiKeyWithSecret.key);

            expect(result).toEqual(mockApiKeyWithSecret);
            expect(readFile).toHaveBeenCalledTimes(2);
        });

        it('should return null if key not found in any file', async () => {
            vi.mocked(readdir).mockResolvedValue(['key1.json', 'key2.json'] as any);
            vi.mocked(readFile)
                .mockResolvedValueOnce(
                    JSON.stringify({ ...mockApiKeyWithSecret, key: 'different-key-1' })
                )
                .mockResolvedValueOnce(
                    JSON.stringify({ ...mockApiKeyWithSecret, key: 'different-key-2' })
                );

            vi.mocked(ApiKeyWithSecretSchema).mockReturnValue({
                parse: vi.fn().mockImplementation((data) => data),
            } as any);

            const result = await apiKeyService.findByKey('non-existent-key');

            expect(result).toBeNull();
            expect(readFile).toHaveBeenCalledTimes(2);
        });

        it('Should return null if an API key is invalid', async () => {
            vi.mocked(readdir).mockResolvedValue(['key1.json'] as any);
            vi.mocked(readFile).mockRejectedValue(new Error('Read error'));

            await expect(apiKeyService.findByKey(mockApiKeyWithSecret.key)).resolves.toBeNull();
        });

        it('should throw specific error for corrupted JSON', async () => {
            vi.mocked(readdir).mockResolvedValue(['key1.json'] as any);
            vi.mocked(readFile).mockResolvedValue('invalid json');

            vi.mocked(ApiKeyWithSecretSchema).mockReturnValue({
                parse: vi.fn().mockImplementation(() => {
                    throw new SyntaxError('Invalid JSON');
                }),
            } as any);

            await expect(apiKeyService.findByKey(mockApiKeyWithSecret.key)).rejects.toThrow(
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
});