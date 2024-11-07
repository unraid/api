import { access, mkdir, readdir, readFile, writeFile } from 'fs/promises';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { join } from 'path';

import { ApiKeyService } from './api-key.service';
import { getters } from '@app/store';
import { Role, type ApiKey, type ApiKeyWithSecret } from '@app/graphql/generated/api/types';

vi.mock('fs/promises', async () => ({
    access: vi.fn(),
    mkdir: vi.fn(),
    readdir: vi.fn(),
    readFile: vi.fn(),
    writeFile: vi.fn(),
}));
vi.mock('@app/store');

describe('ApiKeyService', () => {
    let apiKeyService: ApiKeyService;
    const mockBasePath = '/mock/path/to/keys';

    const mockApiKey: ApiKey = {
        id: 'test-api-id',
        name: 'Test API Key',
        description: 'Test API Key Description',
        roles: [Role.GUEST],
        createdAt: new Date().toISOString(),
        lastUsed: null,
    };

    const mockApiKeyWithSecret: ApiKeyWithSecret = {
        id: 'test-api-id',
        key: 'test-api-key',
        name: 'Test API Key',
        description: 'Test API Key Description',
        roles: [Role.GUEST],
        createdAt: new Date().toISOString(),
        lastUsed: null,
    };

    beforeEach(() => {
        vi.resetAllMocks();

        // Mock the paths getter
        vi.mocked(getters.paths).mockReturnValue({
            'auth-keys': mockBasePath,
        } as any);

        // Mock the fs methods
        vi.mocked(access).mockResolvedValue(undefined);
        vi.mocked(mkdir).mockResolvedValue(undefined);

        apiKeyService = new ApiKeyService();

        vi.spyOn(apiKeyService as any, 'generateApiKey').mockReturnValue('test-api-key');
        vi.mock('uuid', () => ({
            v4: () => 'test-api-id',
        }));
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('paths', () => {
        it('should create directory if it does not exist', async () => {
            vi.mocked(access).mockRejectedValueOnce(new Error());
            vi.mocked(mkdir).mockResolvedValue(undefined);

            await apiKeyService.paths();

            expect(mkdir).toHaveBeenCalledWith(mockBasePath, { recursive: true });
        });

        it('should return correct paths', async () => {
            vi.mocked(access).mockResolvedValueOnce(undefined);

            const paths = await apiKeyService.paths();
            const testId = 'test-id';

            expect(paths.basePath).toBe(mockBasePath);
            expect(paths.keyFile(testId)).toBe(join(mockBasePath, `${testId}.json`));
        });
    });

    describe('create', () => {
        it('should create ApiKeyWithSecret with generated key', async () => {
            const saveSpy = vi.spyOn(apiKeyService, 'saveApiKey').mockResolvedValue();
            const { key, id, name, description, roles } = mockApiKeyWithSecret;

            const result = await apiKeyService.create(name, description ?? '', roles);

            expect(result).toMatchObject({
                id,
                key,
                name,
                description,
                roles,
                createdAt: expect.any(String),
                lastUsed: null,
            });

            expect(saveSpy).toHaveBeenCalledWith(result);
        });

        it('should validate input parameters', async () => {
            const saveSpy = vi.spyOn(apiKeyService, 'saveApiKey');

            await expect(apiKeyService.create('', 'desc', [Role.GUEST])).rejects.toThrow(
                'API key name is required'
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

    describe('findByKey', () => {
        it('should return API key by key value when multiple keys exist', async () => {
            vi.mocked(readdir).mockResolvedValue(['key1.json', 'key2.json'] as any);
            vi.mocked(readFile)
                .mockResolvedValueOnce(JSON.stringify({ ...mockApiKeyWithSecret, key: 'different-key' }))
                .mockResolvedValueOnce(JSON.stringify(mockApiKeyWithSecret));

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

            const result = await apiKeyService.findByKey('non-existent-key');

            expect(result).toBeNull();
            expect(readFile).toHaveBeenCalledTimes(2);
        });

        it('should handle file read errors gracefully', async () => {
            vi.mocked(readdir).mockResolvedValue(['key1.json', 'key2.json'] as any);
            vi.mocked(readFile)
                .mockRejectedValueOnce(new Error('Read error'))
                .mockResolvedValueOnce(JSON.stringify(mockApiKeyWithSecret));

            const result = await apiKeyService.findByKey(mockApiKeyWithSecret.key);

            expect(result).toEqual(mockApiKeyWithSecret);
            expect(readFile).toHaveBeenCalledTimes(2);
        });

        it('should return null if directory read fails', async () => {
            vi.mocked(readdir).mockRejectedValue(new Error('Directory read error'));

            const result = await apiKeyService.findByKey(mockApiKeyWithSecret.key);

            expect(result).toBeNull();
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

            const result = await apiKeyService.findOneByKey('non-existent-key');

            expect(result).toBeNull();
        });

        it('should return null when error occurs', async () => {
            vi.spyOn(apiKeyService, 'findByKey').mockRejectedValue(new Error('Test error'));

            const result = await apiKeyService.findOneByKey('test-api-key');

            expect(result).toBeNull();
        });
    });

    describe('saveApiKey', () => {
        it('should save API key to file', async () => {
            vi.mocked(writeFile).mockResolvedValue(undefined);

            await apiKeyService.saveApiKey(mockApiKey);

            expect(writeFile).toHaveBeenCalledWith(
                join(mockBasePath, `${mockApiKey.id}.json`),
                JSON.stringify(mockApiKey, null, 2)
            );
        });

        it('should throw GraphQLError on write error', async () => {
            vi.mocked(writeFile).mockRejectedValue(new Error('Write failed'));

            await expect(apiKeyService.saveApiKey(mockApiKey)).rejects.toThrow(
                'Failed to save API key: Write failed'
            );
        });
    });
});
